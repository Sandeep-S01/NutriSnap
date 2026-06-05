import type { NutritionTotals } from "@/features/dashboard/dashboard-metrics";
import { calculateNutritionTotals } from "@/features/dashboard/dashboard-metrics";
import type { Meal } from "@/types/meal";

export type AnalyticsRange = {
  startDate: Date;
  endDate: Date;
};

export type AnalyticsTrendPoint = {
  date: string;
  label: string;
  calories: number;
  protein: number;
};

export type FoodFrequency = {
  foodName: string;
  count: number;
  calories: number;
  protein: number;
};

export type AnalyticsReport = {
  totals: NutritionTotals;
  trend: AnalyticsTrendPoint[];
  mostEatenFoods: FoodFrequency[];
};

function getStartOfDay(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTrendLabel(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function normalizeFoodName(foodName: string) {
  return foodName.trim().toLocaleLowerCase();
}

export function getTrailingDateRange(days: number, today = new Date()): AnalyticsRange {
  const endDate = addDays(getStartOfDay(today), 1);
  const startDate = addDays(endDate, -days);

  return { startDate, endDate };
}

export function buildDailyTrend(
  meals: Meal[],
  days: number,
  today = new Date(),
): AnalyticsTrendPoint[] {
  const { startDate } = getTrailingDateRange(days, today);
  const buckets = new Map<string, AnalyticsTrendPoint>();

  for (let index = 0; index < days; index += 1) {
    const date = addDays(startDate, index);
    const dateKey = getDateKey(date);

    buckets.set(dateKey, {
      date: dateKey,
      label: formatTrendLabel(date),
      calories: 0,
      protein: 0,
    });
  }

  for (const meal of meals) {
    const dateKey = getDateKey(new Date(meal.createdAt));
    const current = buckets.get(dateKey);

    if (!current) {
      continue;
    }

    current.calories += meal.calories;
    current.protein += meal.protein;
  }

  return Array.from(buckets.values()).map((point) => ({
    ...point,
    calories: Math.round(point.calories),
    protein: Math.round(point.protein * 10) / 10,
  }));
}

export function getMostEatenFoods(meals: Meal[], limit = 5): FoodFrequency[] {
  const foods = new Map<string, FoodFrequency>();

  for (const meal of meals) {
    const normalizedName = normalizeFoodName(meal.foodName);

    if (!normalizedName) {
      continue;
    }

    const current = foods.get(normalizedName) ?? {
      foodName: meal.foodName.trim(),
      count: 0,
      calories: 0,
      protein: 0,
    };

    current.count += 1;
    current.calories += meal.calories;
    current.protein += meal.protein;
    foods.set(normalizedName, current);
  }

  return Array.from(foods.values())
    .map((food) => ({
      ...food,
      calories: Math.round(food.calories),
      protein: Math.round(food.protein * 10) / 10,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return right.calories - left.calories;
    })
    .slice(0, limit);
}

export function buildAnalyticsReport(meals: Meal[], days: number): AnalyticsReport {
  return {
    totals: calculateNutritionTotals(meals),
    trend: buildDailyTrend(meals, days),
    mostEatenFoods: getMostEatenFoods(meals),
  };
}
