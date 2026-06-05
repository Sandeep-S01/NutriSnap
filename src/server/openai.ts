import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as {
  openai?: OpenAI;
};

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  globalForOpenAI.openai ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return globalForOpenAI.openai;
}
