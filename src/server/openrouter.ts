import { foodAnalysisPrompt } from "@/features/analysis/food-analysis-prompt";
import {
  createProviderError,
  fetchImageAsBase64,
  parseFoodAnalysisJson,
  type FoodAnalysisProviderResult,
} from "@/server/ai-analysis-utils";

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it:free";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    code?: string | number;
    message?: string;
  };
};

function getOutputText(payload: OpenRouterResponse) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

export async function analyzeFoodImageWithOpenRouter(
  imageUrl: string,
  options?: { model?: string },
): Promise<FoodAnalysisProviderResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const model =
    options?.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL;
  const image = await fetchImageAsBase64(imageUrl);
  const imageDataUrl = `data:${image.contentType};base64,${image.base64}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://nutrisnap.app",
      "X-Title": "NutriSnap",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${foodAnalysisPrompt}\n\nAnalyze this food image and return only valid JSON. Do not include markdown fences or explanatory text.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 900,
    }),
  });

  const payload = (await response.json()) as OpenRouterResponse;

  if (!response.ok || payload.error) {
    throw createProviderError({
      provider: "OpenRouter",
      model,
      status: response.status,
      code: payload.error?.code,
      message:
        payload.error?.message ?? `OpenRouter request failed: ${response.status}`,
    });
  }

  const outputText = getOutputText(payload);

  if (!outputText) {
    throw new Error("OpenRouter returned an empty analysis response.");
  }

  return {
    analysis: parseFoodAnalysisJson(outputText, "OpenRouter"),
    rawResponse: payload,
    provider: "OpenRouter",
    model,
  };
}
