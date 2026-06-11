import { z } from "zod";

export const DEFAULT_USER_PREFERENCES = {
  dailyCaloriesTarget: 2000,
  dailyProteinTarget: 100,
} as const;

export const updateUserPreferenceSchema = z.object({
  dailyCaloriesTarget: z
    .number()
    .min(1, "Daily calorie target must be greater than 0.")
    .max(20000, "Daily calorie target is too high."),
  dailyProteinTarget: z
    .number()
    .min(1, "Daily protein target must be greater than 0.")
    .max(1000, "Daily protein target is too high."),
});

export type UserPreferenceInput = z.infer<typeof updateUserPreferenceSchema>;
