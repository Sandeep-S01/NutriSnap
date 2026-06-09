"use server";

import { z } from "zod";
import { requireCurrentUser } from "@/actions/auth";
import {
  analyzeFoodImageWithGemini,
  DEFAULT_GEMINI_FALLBACK_MODEL,
  DEFAULT_GEMINI_MODEL,
} from "@/server/gemini";
import { appLogger } from "@/server/logger";
import {
  analyzeFoodImageWithOpenRouter,
  DEFAULT_OPENROUTER_MODEL,
} from "@/server/openrouter";
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

function getErrorProvider(error: unknown) {
  return error && typeof error === "object" && "provider" in error
    ? String(error.provider)
    : "AI provider";
}

function getErrorModel(error: unknown) {
  return error && typeof error === "object" && "model" in error
    ? String(error.model)
    : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getAnalysisErrorMessage(error: unknown) {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const provider = getErrorProvider(error);
  const message = getErrorMessage(error).toLowerCase();

  if (
    code === "insufficient_quota" ||
    message.includes("insufficient_quota") ||
    message.includes("quota")
  ) {
    return `${provider} quota is exhausted for now. Please wait or check that provider's quota.`;
  }

  if (status === 429) {
    return `${provider} rate limit reached. Please wait a moment and retry analysis.`;
  }

  if (status === 401 || code === "invalid_api_key") {
    return `${provider} API key is invalid. Update the provider API key and redeploy.`;
  }

  if (status === 403) {
    return `${provider} does not have access to the selected vision model.`;
  }

  if (
    message.includes("image") &&
    (message.includes("download") ||
      message.includes("fetch") ||
      message.includes("url"))
  ) {
    return "The AI provider could not read the uploaded image. Please upload again and retry analysis.";
  }

  if (status >= 500) {
    return `${provider} is temporarily unavailable. Please retry analysis in a moment.`;
  }

  return "Unable to analyze image. Please try again.";
}

function shouldRetryProvider(error: unknown) {
  const status = getErrorStatus(error);
  return status === 0 || status >= 500;
}

function isImageFetchError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("image") &&
    (message.includes("download") ||
      message.includes("fetch") ||
      message.includes("url"))
  );
}

function getProviderAttempts(imageUrl: string) {
  const providers: Array<{
    provider: string;
    model: string;
    run: () => ReturnType<typeof analyzeFoodImageWithGemini>;
  }> = [];

  if (process.env.GEMINI_API_KEY) {
    const primaryGeminiModel = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    const fallbackGeminiModel =
      process.env.GEMINI_FALLBACK_MODEL ?? DEFAULT_GEMINI_FALLBACK_MODEL;

    providers.push({
      provider: "Gemini",
      model: primaryGeminiModel,
      run: () =>
        analyzeFoodImageWithGemini(imageUrl, { model: primaryGeminiModel }),
    });

    if (fallbackGeminiModel !== primaryGeminiModel) {
      providers.push({
        provider: "Gemini",
        model: fallbackGeminiModel,
        run: () =>
          analyzeFoodImageWithGemini(imageUrl, { model: fallbackGeminiModel }),
      });
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    const openRouterModel =
      process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;

    providers.push({
      provider: "OpenRouter",
      model: openRouterModel,
      run: () =>
        analyzeFoodImageWithOpenRouter(imageUrl, { model: openRouterModel }),
    });
  }

  return providers;
}

async function analyzeWithProviderFallback(imageUrl: string) {
  const providers = getProviderAttempts(imageUrl);

  if (providers.length === 0) {
    throw new Error(
      "No AI analysis provider is configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY and redeploy.",
    );
  }

  let lastError: unknown;

  for (const provider of providers) {
    try {
      return await withRetry(provider.run, {
        attempts: 2,
        delayMs: 750,
        shouldRetry: shouldRetryProvider,
      });
    } catch (error) {
      lastError = error;

      appLogger.warn("AI provider analysis failed; trying next provider", {
        provider: provider.provider,
        model: provider.model,
        status: getErrorStatus(error),
        code: getErrorCode(error),
        errorProvider: getErrorProvider(error),
        errorModel: getErrorModel(error),
        errorMessage: getErrorMessage(error),
      });

      if (isImageFetchError(error)) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("All AI analysis providers failed.");
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

    const providerResult = await analyzeWithProviderFallback(
      parsedInput.data.imageUrl,
    );

    return {
      status: "success",
      message: "Food analysis completed.",
      analysis: providerResult.analysis,
      rawResponse: {
        provider: providerResult.provider,
        model: providerResult.model,
        response: providerResult.rawResponse,
      },
    };
  } catch (error) {
    appLogger.error("Food image analysis failed", error);

    return {
      status: "error",
      message: getAnalysisErrorMessage(error),
    };
  }
}
