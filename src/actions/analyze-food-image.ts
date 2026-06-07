"use server";

import { z } from "zod";
import { requireCurrentUser } from "@/actions/auth";
import { analyzeFoodImageWithGemini } from "@/server/gemini";
import { appLogger } from "@/server/logger";
import { checkRateLimit } from "@/server/rate-limit";
import { withRetry } from "@/server/retry";
import type { AnalyzeFoodImageState } from "@/types/nutrition";

const analyzeFoodImageInputSchema = z.object({
  imageUrl: z.string().url("A valid uploaded image URL is required."),
});

function getErrorStatus(error: unknown) {
  return error && typeof error === "object" && "status" in error
    ? Number(error.status)
    : 0;
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getAnalysisErrorMessage(error: unknown) {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  if (
    code === "insufficient_quota" ||
    message.includes("insufficient_quota") ||
    message.includes("quota")
  ) {
    return "Gemini quota is exhausted for now. Please wait or check your Google AI Studio quota.";
  }

  if (status === 429) {
    return "Gemini rate limit reached. Please wait a moment and retry analysis.";
  }

  if (status === 401 || code === "invalid_api_key") {
    return "Gemini API key is invalid. Update GEMINI_API_KEY and redeploy.";
  }

  if (status === 403) {
    return "This Gemini key does not have access to the selected vision model.";
  }

  if (
    message.includes("image") &&
    (message.includes("download") ||
      message.includes("fetch") ||
      message.includes("url"))
  ) {
    return "Gemini could not read the uploaded image. Please upload again and retry analysis.";
  }

  if (status >= 500) {
    return "Gemini is temporarily unavailable. Please retry analysis in a moment.";
  }

  return "Unable to analyze image. Please try again.";
}

export async function analyzeFoodImage(
  input: z.infer<typeof analyzeFoodImageInputSchema>,
): Promise<AnalyzeFoodImageState> {
  try {
    const user = await requireCurrentUser();
    const rateLimit = checkRateLimit({
      key: `analysis:${user.id}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many analysis requests. Please wait a moment and try again.",
      };
    }

    const parsedInput = analyzeFoodImageInputSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        status: "error",
        message:
          parsedInput.error.issues[0]?.message ??
          "A valid uploaded image URL is required.",
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        status: "error",
        message: "Gemini is not configured. Add GEMINI_API_KEY in Vercel and redeploy.",
      };
    }

    const geminiResult = await withRetry(
      () => analyzeFoodImageWithGemini(parsedInput.data.imageUrl),
      {
        attempts: 2,
        delayMs: 750,
        shouldRetry: (error) => {
          const status = getErrorStatus(error);
          return status === 0 || status >= 500;
        },
      },
    );

    return {
      status: "success",
      message: "Food analysis completed.",
      analysis: geminiResult.analysis,
      rawResponse: geminiResult.rawResponse,
    };
  } catch (error) {
    appLogger.error("Food image analysis failed", error);

    return {
      status: "error",
      message: getAnalysisErrorMessage(error),
    };
  }
}
