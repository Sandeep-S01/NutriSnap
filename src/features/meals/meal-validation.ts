import { z } from "zod";
import { foodAnalysisSchema } from "@/features/analysis/food-analysis-schema";

export const createMealSchema = foodAnalysisSchema.extend({
  imageUrl: z.string().url("A valid image URL is required."),
  aiRawResponse: z.unknown(),
});

export const updateMealSchema = foodAnalysisSchema
  .partial()
  .extend({
    imageUrl: z.string().url("A valid image URL is required.").optional(),
    aiRawResponse: z.unknown().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one meal field is required.",
  });

export const mealIdSchema = z.object({
  id: z.string().min(1, "Meal id is required."),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
