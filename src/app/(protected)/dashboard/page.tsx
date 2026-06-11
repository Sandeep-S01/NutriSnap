import { auth } from "@clerk/nextjs/server";
import { ScanLine } from "lucide-react";
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
import { getUserPreference } from "@/server/preferences";

const statConfig = [
  { key: "calories", label: "Calories", unit: "kcal", className: "text-calories" },
  { key: "protein", label: "Protein", unit: "g", className: "text-protein" },
  { key: "carbs", label: "Carbs", unit: "g", className: "text-carbs" },
  { key: "fat", label: "Fat", unit: "g", className: "text-fat" },
  { key: "fiber", label: "Fiber", unit: "g", className: "text-fiber" },
] as const;

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [todayMeals, recentMeals, preference] = await Promise.all([
    getMealsForDateRange(userId, getStartOfToday(), getStartOfTomorrow()),
    getRecentMeals(userId, 8),
    getUserPreference(userId),
  ]);
  const totals = calculateNutritionTotals(todayMeals);
  const chartData = buildTodayChartData(todayMeals);
  const todayLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-8 lg:py-7">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            Today · {todayLabel}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-normal text-slate-950">
            Nutrition snapshot
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review today&apos;s intake, spot macro balance, and continue logging
            meals without digging through history.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          <ScanLine className="mr-2 size-4" aria-hidden="true" />
          Scan meal
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statConfig.map((stat) => (
          <article
            key={stat.key}
            className="rounded-lg border border-border-subtle bg-surface p-4"
          >
            <p className="text-xs font-medium uppercase text-slate-500">
              {stat.label}
            </p>
            <p className={["mt-3 text-[28px] font-semibold", stat.className].join(" ")}>
              {roundNutritionValue(totals[stat.key])}
              <span className="ml-1 text-sm font-medium text-slate-500">
                {stat.unit}
              </span>
            </p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <GoalProgress
          label="Calorie goal"
          value={totals.calories}
          target={preference.dailyCaloriesTarget}
          unit="kcal"
          barClassName="bg-calories"
        />
        <GoalProgress
          label="Protein goal"
          value={totals.protein}
          target={preference.dailyProteinTarget}
          unit="g"
          barClassName="bg-protein"
        />
      </section>

      <section className="mt-4 rounded-lg border border-border-subtle bg-surface p-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Intake by meal
            </h2>
            <p className="text-sm text-slate-600">
              Calories and protein from meals saved today.
            </p>
          </div>
        </div>
        <NutritionChart data={chartData} />
      </section>

      <div className="mt-4">
        <RecentMeals meals={recentMeals} />
      </div>
    </main>
  );
}

function GoalProgress({
  label,
  value,
  target,
  unit,
  barClassName,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  barClassName: string;
}) {
  const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const remaining = Math.max(target - value, 0);

  return (
    <article className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{label}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {roundNutritionValue(value)} of {roundNutritionValue(target)} {unit}
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-950">
          {Math.round(percent)}%
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={["h-full rounded-full", barClassName].join(" ")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {remaining > 0
          ? `${roundNutritionValue(remaining)} ${unit} remaining today`
          : `Daily ${unit} target reached`}
      </p>
    </article>
  );
}
