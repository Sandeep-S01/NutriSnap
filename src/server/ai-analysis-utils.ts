import { foodAnalysisSchema } from "@/features/analysis/food-analysis-schema";
import type { FoodAnalysisResult } from "@/types/nutrition";

export type UploadedImagePayload = {
  base64: string;
  contentType: string;
};

export type FoodAnalysisProviderResult = {
  analysis: FoodAnalysisResult;
  rawResponse: unknown;
  provider: string;
  model: string;
};

export async function fetchImageAsBase64(
  imageUrl: string,
): Promise<UploadedImagePayload> {
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

export function extractJson(text: string, provider: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error(`${provider} returned a response without JSON.`);
  }

  return match[0];
}

export function parseFoodAnalysisJson(
  text: string,
  provider: string,
): FoodAnalysisResult {
  const parsedJson = JSON.parse(extractJson(text, provider)) as unknown;
  const parsedAnalysis = foodAnalysisSchema.safeParse(parsedJson);

  if (!parsedAnalysis.success) {
    throw new Error(`${provider} returned analysis data in an unexpected shape.`);
  }

  return parsedAnalysis.data;
}

export function createProviderError({
  provider,
  model,
  status,
  code,
  message,
}: {
  provider: string;
  model: string;
  status: number;
  code?: string | number;
  message: string;
}) {
  const error = new Error(message);
  Object.assign(error, {
    provider,
    model,
    status,
    code: code ? String(code) : "",
  });

  return error;
}
