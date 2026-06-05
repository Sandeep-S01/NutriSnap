import type { FoodAnalysisResult } from "@/types/nutrition";

export type Meal = FoodAnalysisResult & {
  id: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type MealMutationResult =
  | {
      status: "success";
      message: string;
      meal: Meal;
    }
  | {
      status: "error";
      message: string;
    };
