import { foodAnalysisPrompt } from "@/features/analysis/food-analysis-prompt";
import {
  foodAnalysisJsonSchema,
  foodAnalysisSchema,
} from "@/features/analysis/food-analysis-schema";
import type { FoodAnalysisResult } from "@/types/nutrition";

const GEMINI_MODEL = "gemini-1.5-flash";

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

async function fetchImageAsBase64(imageUrl: string) {
  const response = await fetch(imageUrl, {
    headers: {
      Accept: "image/jpeg,image/png,image/webp",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to download uploaded image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const bytes = Buffer.from(await response.arrayBuffer());

  return {
    base64: bytes.toString("base64"),
    contentType,
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Gemini returned a response without JSON.");
  }

  return match[0];
}

function toGeminiSchema(schema: typeof foodAnalysisJsonSchema) {
  return JSON.parse(JSON.stringify(schema, (_key, value) => {
    if (value === "object") return "OBJECT";
    if (value === "array") return "ARRAY";
    if (value === "string") return "STRING";
    if (value === "number") return "NUMBER";
    return value;
  })) as unknown;
}

export async function analyzeFoodImageWithGemini(
  imageUrl: string,
): Promise<{ analysis: FoodAnalysisResult; rawResponse: unknown }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const image = await fetchImageAsBase64(imageUrl);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

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
    const error = new Error(message);
    Object.assign(error, {
      status: response.status,
      code: payload.error?.status,
    });
    throw error;
  }

  const outputText =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  if (!outputText) {
    throw new Error("Gemini returned an empty analysis response.");
  }

  const parsedJson = JSON.parse(extractJson(outputText)) as unknown;
  const parsedAnalysis = foodAnalysisSchema.safeParse(parsedJson);

  if (!parsedAnalysis.success) {
    throw new Error("Gemini returned analysis data in an unexpected shape.");
  }

  return {
    analysis: parsedAnalysis.data,
    rawResponse: parsedJson,
  };
}
