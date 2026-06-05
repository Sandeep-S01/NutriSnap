export type VitaminAmount = {
  name: string;
  amount: string;
};

export type FoodAnalysisResult = {
  foodName: string;
  estimatedWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins: VitaminAmount[];
  confidence: number;
};

export type AnalyzeFoodImageState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
  analysis?: FoodAnalysisResult;
  rawResponse?: unknown;
};
