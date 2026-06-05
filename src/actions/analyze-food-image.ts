"use server";

import { z } from "zod";
import { requireCurrentUser } from "@/actions/auth";
import {
  foodAnalysisJsonSchema,
  foodAnalysisSchema,
} from "@/features/analysis/food-analysis-schema";
import { foodAnalysisPrompt } from "@/features/analysis/food-analysis-prompt";
import { appLogger } from "@/server/logger";
import { getOpenAIClient } from "@/server/openai";
import { checkRateLimit } from "@/server/rate-limit";
import { withRetry } from "@/server/retry";
import type { AnalyzeFoodImageState } from "@/types/nutrition";

const analyzeFoodImageInputSchema = z.object({
  imageUrl: z.string().url("A valid uploaded image URL is required."),
});

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

    const openai = getOpenAIClient();
    const response = await withRetry(
      () =>
        openai.responses.create({
          model: "gpt-4o",
          instructions: foodAnalysisPrompt,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "Analyze this food image and return the nutrition estimate.",
                },
                {
                  type: "input_image",
                  image_url: parsedInput.data.imageUrl,
                  detail: "high",
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "food_nutrition_analysis",
              strict: true,
              schema: foodAnalysisJsonSchema,
            },
          },
        }),
      {
        attempts: 2,
        delayMs: 750,
        shouldRetry: (error) => {
          const status = error && typeof error === "object" && "status" in error
            ? Number(error.status)
            : 0;

          return status === 0 || status === 429 || status >= 500;
        },
      },
    );

    if (!response.output_text) {
      return {
        status: "error",
        message: "OpenAI returned an empty analysis response.",
        rawResponse: response,
      };
    }

    const parsedJson = JSON.parse(response.output_text) as unknown;
    const parsedAnalysis = foodAnalysisSchema.safeParse(parsedJson);

    if (!parsedAnalysis.success) {
      return {
        status: "error",
        message: "OpenAI returned analysis data in an unexpected shape.",
        rawResponse: parsedJson,
      };
    }

    return {
      status: "success",
      message: "Food analysis completed.",
      analysis: parsedAnalysis.data,
      rawResponse: parsedJson,
    };
  } catch (error) {
    appLogger.error("Food image analysis failed", error);

    return {
      status: "error",
      message: "Unable to analyze image. Please try again.",
    };
  }
}
