import type { FoodFrequency } from "@/features/analytics/analytics-metrics";

export function MostEatenFoods({ foods }: { foods: FoodFrequency[] }) {
  if (foods.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-surface-muted p-6 text-center text-sm text-slate-500">
        Most eaten foods will appear after meals are saved.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle">
      <div className="grid grid-cols-[1fr_auto] gap-3 bg-surface-muted px-4 py-3 text-xs font-semibold uppercase text-slate-500 sm:grid-cols-[1fr_90px_110px_110px]">
        <span>Food</span>
        <span className="text-right">Meals</span>
        <span className="hidden text-right sm:block">Calories</span>
        <span className="hidden text-right sm:block">Protein</span>
      </div>
      <div className="divide-y divide-slate-200 bg-white">
        {foods.map((food) => (
          <div
            key={food.foodName}
            className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 text-sm sm:grid-cols-[1fr_90px_110px_110px]"
          >
            <span className="font-medium text-slate-950">{food.foodName}</span>
            <span className="text-right text-slate-700">{food.count}</span>
            <span className="hidden text-right text-slate-700 sm:block">
              {food.calories} kcal
            </span>
            <span className="hidden text-right text-slate-700 sm:block">
              {food.protein} g
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
