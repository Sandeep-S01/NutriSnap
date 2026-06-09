import { foodAnalysisPrompt } from "@/features/analysis/food-analysis-prompt";
import {
  foodAnalysisJsonSchema,
} from "@/features/analysis/food-analysis-schema";
import {
  createProviderError,
  fetchImageAsBase64,
  parseFoodAnalysisJson,
  type FoodAnalysisProviderResult,
} from "@/server/ai-analysis-utils";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

function toGeminiSchema(schema: typeof foodAnalysisJsonSchema) {
  return JSON.parse(
    JSON.stringify(schema, (key, value) => {
      if (key === "additionalProperties") return undefined;
      if (key === "minimum") return undefined;
      if (key === "maximum") return undefined;
      if (value === "object") return "OBJECT";
      if (value === "array") return "ARRAY";
      if (value === "string") return "STRING";
      if (value === "number") return "NUMBER";
      return value;
    }),
  ) as unknown;
}

export async function analyzeFoodImageWithGemini(
  imageUrl: string,
  options?: { model?: string },
): Promise<FoodAnalysisProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const image = await fetchImageAsBase64(imageUrl);
  const model = options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${foodAnalysisPrompt}\n\nAnalyze this food image and return only valid JSON matching the requested schema.`,
            },
            {
              inlineData: {
                mimeType: image.contentType,
                data: image.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(foodAnalysisJsonSchema),
      },
    }),
  });

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok || payload.error) {
    const message =
      payload.error?.message ?? `Gemini request failed: ${response.status}`;
    throw createProviderError({
      provider: "Gemini",
      model,
      status: response.status,
      code: payload.error?.status,
      message,
    });
  }

  const outputText =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!outputText) {
    throw new Error("Gemini returned an empty analysis response.");
  }

  return {
    analysis: parseFoodAnalysisJson(outputText, "Gemini"),
    rawResponse: payload,
    provider: "Gemini",
    model,
  };
}
