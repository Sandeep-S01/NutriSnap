import Image from "next/image";
import type { Meal } from "@/types/meal";

export function RecentMeals({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-surface p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">
          No meals logged yet
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Scan a meal and save the result to start today&apos;s log.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle p-4">
        <h2 className="text-base font-semibold text-slate-950">Meal history</h2>
        <p className="mt-1 text-sm text-slate-600">
          Latest saved meals across your nutrition log.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {meals.map((meal) => (
          <article
            key={meal.id}
            className="grid grid-cols-[56px_1fr] gap-3 p-4 sm:grid-cols-[64px_1fr_auto]"
          >
            <div className="overflow-hidden rounded-md bg-slate-100">
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
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                  {Math.round(meal.protein)}g protein
                </span>
                <span className="rounded bg-violet-50 px-2 py-1 text-violet-700">
                  {Math.round(meal.carbs)}g carbs
                </span>
                <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">
                  {Math.round(meal.fat)}g fat
                </span>
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:block sm:text-right">
              <p className="text-lg font-semibold text-calories">
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
