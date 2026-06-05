import { z } from 'zod';

export const AnalyzeSchema = z.object({
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  fileName: z.string().optional(),
}).refine(data => data.image || data.imageUrl, {
  message: "At least one of image or imageUrl is required",
  path: ["image"]
});

export const FoodEntrySchema = z.object({
  id: z.string().optional(),
  food_name: z.string().min(1, "Food name is required").max(200),
  calories: z.number().int().nonnegative("Calories must be a non-negative integer"),
  protein: z.number().nonnegative("Protein must be a non-negative number"),
  carbs: z.number().nonnegative("Carbs must be a non-negative number"),
  fat: z.number().nonnegative("Fat must be a non-negative number"),
  fiber: z.number().nonnegative("Fiber must be a non-negative number").optional().default(0),
  sugar: z.number().nonnegative("Sugar must be a non-negative number").optional().default(0),
  sodium: z.number().nonnegative("Sodium must be a non-negative number").optional().default(0),
  potassium: z.number().nonnegative("Potassium must be a non-negative number").optional().default(0),
  iron: z.number().nonnegative("Iron must be a non-negative number").optional().default(0),
  vitamin_a: z.number().nonnegative("Vitamin A must be a non-negative number").optional().default(0),
  vitamin_b: z.number().nonnegative("Vitamin B must be a non-negative number").optional().default(0),
  vitamin_c: z.number().nonnegative("Vitamin C must be a non-negative number").optional().default(0),
  vitamin_d: z.number().nonnegative("Vitamin D must be a non-negative number").optional().default(0),
  image_url: z.string().optional().or(z.null()),
  scanned_at: z.string().optional()
});

export const WeightLogSchema = z.object({
  id: z.string().optional(),
  weight: z.number().positive("Weight must be greater than 0").max(600),
  logged_at: z.string().optional()
});

export const WaterLogSchema = z.object({
  id: z.string().optional(),
  amount_ml: z.number().int().positive("Water volume must be a positive integer").max(10000),
  logged_at: z.string().optional()
});

export const GoalsSchema = z.object({
  daily_calories: z.number().int().min(500, "Calories must be at least 500 kcal").max(10000),
  daily_protein: z.number().nonnegative().max(1000),
  daily_carbs: z.number().nonnegative().max(2000),
  daily_fat: z.number().nonnegative().max(500),
  daily_fiber: z.number().nonnegative().max(200),
  target_weight: z.number().positive().max(600),
  daily_water: z.number().int().min(500, "Hydration target must be at least 500 ml").max(10000)
});

export const NotificationActionSchema = z.object({
  id: z.string().uuid("Invalid notification ID").optional(),
  action: z.enum(['read', 'clear_all', 'create']),
  title: z.string().optional(),
  message: z.string().optional(),
  type: z.enum(['info', 'success', 'warning']).optional(),
});
