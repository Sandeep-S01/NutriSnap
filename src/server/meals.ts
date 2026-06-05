import type { Prisma } from "@prisma/client";
import type {
  CreateMealInput,
  UpdateMealInput,
} from "@/features/meals/meal-validation";
import { prisma } from "@/server/db";
import type { FoodAnalysisResult, VitaminAmount } from "@/types/nutrition";
import type { Meal } from "@/types/meal";

const mealSelect = {
  id: true,
  imageUrl: true,
  foodName: true,
  estimatedWeightGrams: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
  fiber: true,
  vitamins: true,
  confidence: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MealSelect;

type MealRecord = Prisma.MealGetPayload<{ select: typeof mealSelect }>;

function normalizeVitamins(value: Prisma.JsonValue): VitaminAmount[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      "name" in item &&
      "amount" in item &&
      typeof item.name === "string" &&
      typeof item.amount === "string"
    ) {
      return [{ name: item.name, amount: item.amount }];
    }

    return [];
  });
}

function toMeal(record: MealRecord): Meal {
  return {
    id: record.id,
    imageUrl: record.imageUrl,
    foodName: record.foodName,
    estimatedWeightGrams: record.estimatedWeightGrams,
    calories: record.calories,
    protein: record.protein,
    carbs: record.carbs,
    fat: record.fat,
    fiber: record.fiber,
    vitamins: normalizeVitamins(record.vitamins),
    confidence: record.confidence,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toAnalysisInput(input: UpdateMealInput): Partial<FoodAnalysisResult> {
  return {
    foodName: input.foodName,
    estimatedWeightGrams: input.estimatedWeightGrams,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    fiber: input.fiber,
    vitamins: input.vitamins,
    confidence: input.confidence,
  };
}

export async function createMeal(clerkUserId: string, input: CreateMealInput) {
  const meal = await prisma.meal.create({
    data: {
      clerkUserId,
      imageUrl: input.imageUrl,
      foodName: input.foodName,
      estimatedWeightGrams: input.estimatedWeightGrams,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      fiber: input.fiber,
      vitamins: input.vitamins,
      confidence: input.confidence,
      aiRawResponse: input.aiRawResponse as Prisma.InputJsonValue,
    },
    select: mealSelect,
  });

  return toMeal(meal);
}

export async function updateMeal(
  clerkUserId: string,
  mealId: string,
  input: UpdateMealInput,
) {
  const existingMeal = await prisma.meal.findFirst({
    where: { id: mealId, clerkUserId },
    select: { id: true },
  });

  if (!existingMeal) {
    return null;
  }

  const analysisInput = toAnalysisInput(input);
  const updatedMeal = await prisma.meal.update({
    where: { id: mealId },
    data: {
      ...analysisInput,
      imageUrl: input.imageUrl,
      vitamins: input.vitamins,
      aiRawResponse: input.aiRawResponse as Prisma.InputJsonValue | undefined,
    },
    select: mealSelect,
  });

  return toMeal(updatedMeal);
}

export async function deleteMeal(clerkUserId: string, mealId: string) {
  const existingMeal = await prisma.meal.findFirst({
    where: { id: mealId, clerkUserId },
    select: mealSelect,
  });

  if (!existingMeal) {
    return null;
  }

  await prisma.meal.delete({
    where: { id: mealId },
  });

  return toMeal(existingMeal);
}

export async function getRecentMeals(clerkUserId: string, limit = 10) {
  const meals = await prisma.meal.findMany({
    where: { clerkUserId },
    select: mealSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return meals.map(toMeal);
}

export async function getMealsForDateRange(
  clerkUserId: string,
  startDate: Date,
  endDate: Date,
) {
  const meals = await prisma.meal.findMany({
    where: {
      clerkUserId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: mealSelect,
    orderBy: { createdAt: "asc" },
  });

  return meals.map(toMeal);
}
