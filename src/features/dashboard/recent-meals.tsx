import Image from "next/image";
import type { Meal } from "@/types/meal";

export function RecentMeals({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">
          No meals logged yet
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Upload a food image, analyze it, then save the meal to see history.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-950">Recent meals</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {meals.map((meal) => (
          <article
            key={meal.id}
            className="grid grid-cols-[64px_1fr] gap-4 p-4 sm:grid-cols-[72px_1fr_auto]"
          >
            <div className="overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={meal.imageUrl}
                alt={meal.foodName}
                width={144}
                height={144}
                className="aspect-square h-full w-full object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-950">
                {meal.foodName}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(meal.createdAt))}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span>{Math.round(meal.protein)}g protein</span>
                <span>{Math.round(meal.carbs)}g carbs</span>
                <span>{Math.round(meal.fat)}g fat</span>
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:block sm:text-right">
              <p className="text-lg font-semibold text-emerald-700">
                {Math.round(meal.calories)}
              </p>
              <p className="text-xs text-slate-500">kcal</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
