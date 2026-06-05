import { z } from "zod";

export const foodAnalysisSchema = z.object({
  foodName: z.string().min(1),
  estimatedWeightGrams: z.number().min(0),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  vitamins: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.string().min(1),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

export const foodAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "foodName",
    "estimatedWeightGrams",
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "vitamins",
    "confidence",
  ],
  properties: {
    foodName: {
      type: "string",
      description:
        "Concise food or meal name. Use a combined meal name for multiple foods.",
    },
    estimatedWeightGrams: {
      type: "number",
      minimum: 0,
      description: "Estimated visible edible portion weight in grams.",
    },
    calories: {
      type: "number",
      minimum: 0,
      description: "Estimated calories for the visible serving.",
    },
    protein: {
      type: "number",
      minimum: 0,
      description: "Estimated protein grams for the visible serving.",
    },
    carbs: {
      type: "number",
      minimum: 0,
      description: "Estimated carbohydrate grams for the visible serving.",
    },
    fat: {
      type: "number",
      minimum: 0,
      description: "Estimated fat grams for the visible serving.",
    },
    fiber: {
      type: "number",
      minimum: 0,
      description: "Estimated fiber grams for the visible serving.",
    },
    vitamins: {
      type: "array",
      description:
        "Relevant vitamins or minerals visible or typical for the identified foods.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "amount"],
        properties: {
          name: { type: "string" },
          amount: {
            type: "string",
            description: "Estimated amount or qualitative level.",
          },
        },
      },
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence in food identification and estimate accuracy.",
    },
  },
} as const;
