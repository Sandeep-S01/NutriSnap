import type { Meal } from "@/types/meal";

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type ChartPoint = {
  label: string;
  calories: number;
  protein: number;
};

export function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getStartOfTomorrow() {
  const date = getStartOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export function calculateNutritionTotals(meals: Meal[]): NutritionTotals {
  return meals.reduce<NutritionTotals>(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
      fiber: totals.fiber + meal.fiber,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  );
}

export function buildTodayChartData(meals: Meal[]): ChartPoint[] {
  const buckets = new Map<string, ChartPoint>();

  for (const meal of meals) {
    const label = new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(meal.createdAt));
    const current = buckets.get(label) ?? {
      label,
      calories: 0,
      protein: 0,
    };

    current.calories += meal.calories;
    current.protein += meal.protein;
    buckets.set(label, current);
  }

  return Array.from(buckets.values());
}

export function roundNutritionValue(value: number) {
  return Math.round(value * 10) / 10;
}
