import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  buildTodayChartData,
  calculateNutritionTotals,
  getStartOfToday,
  getStartOfTomorrow,
  roundNutritionValue,
} from "@/features/dashboard/dashboard-metrics";
import { NutritionChart } from "@/features/dashboard/nutrition-chart";
import { RecentMeals } from "@/features/dashboard/recent-meals";
import { getMealsForDateRange, getRecentMeals } from "@/server/meals";

const statConfig = [
  { key: "calories", label: "Calories today", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
] as const;

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [todayMeals, recentMeals] = await Promise.all([
    getMealsForDateRange(userId, getStartOfToday(), getStartOfTomorrow()),
    getRecentMeals(userId, 8),
  ]);
  const totals = calculateNutritionTotals(todayMeals);
  const chartData = buildTodayChartData(todayMeals);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Today&apos;s nutrition
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Track calories, macros, fiber, and recent meal history from saved
            food analyses.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Upload food image
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statConfig.map((stat) => (
          <article
            key={stat.key}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <p className="text-sm text-slate-600">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {roundNutritionValue(totals[stat.key])}
              <span className="ml-1 text-sm font-medium text-slate-500">
                {stat.unit}
              </span>
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Calories and protein consumed
            </h2>
            <p className="text-sm text-slate-600">
              Saved meals grouped by time today.
            </p>
          </div>
        </div>
        <NutritionChart data={chartData} />
      </section>

      <div className="mt-6">
        <RecentMeals meals={recentMeals} />
      </div>
    </main>
  );
}
