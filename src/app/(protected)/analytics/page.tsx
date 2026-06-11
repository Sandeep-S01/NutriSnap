import { auth } from "@clerk/nextjs/server";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  buildAnalyticsReport,
  getTrailingDateRange,
} from "@/features/analytics/analytics-metrics";
import { AnalyticsTrendChart } from "@/features/analytics/analytics-trend-chart";
import { MostEatenFoods } from "@/features/analytics/most-eaten-foods";
import { roundNutritionValue } from "@/features/dashboard/dashboard-metrics";
import { getMealsForDateRange } from "@/server/meals";

const reportStats = [
  { key: "calories", label: "Calories", unit: "kcal", className: "text-calories" },
  { key: "protein", label: "Protein", unit: "g", className: "text-protein" },
  { key: "carbs", label: "Carbs", unit: "g", className: "text-carbs" },
  { key: "fat", label: "Fat", unit: "g", className: "text-fat" },
  { key: "fiber", label: "Fiber", unit: "g", className: "text-fiber" },
] as const;

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const weeklyRange = getTrailingDateRange(7);
  const monthlyRange = getTrailingDateRange(30);
  const [weeklyMeals, monthlyMeals] = await Promise.all([
    getMealsForDateRange(userId, weeklyRange.startDate, weeklyRange.endDate),
    getMealsForDateRange(userId, monthlyRange.startDate, monthlyRange.endDate),
  ]);
  const weeklyReport = buildAnalyticsReport(weeklyMeals, 7);
  const monthlyReport = buildAnalyticsReport(monthlyMeals, 30);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-8 lg:py-7">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            Insights
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-normal text-slate-950">
            Nutrition trends
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Compare recent intake patterns, meal frequency, and recurring foods
            from your saved scans.
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

      <section className="grid gap-4 xl:grid-cols-2">
        <ReportSummary title="7-day summary" days={7} totals={weeklyReport.totals} />
        <ReportSummary title="30-day summary" days={30} totals={monthlyReport.totals} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-border-subtle bg-surface p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">
              7-day calories and protein
            </h2>
            <p className="text-sm text-slate-600">
              Daily totals across the trailing week.
            </p>
          </div>
          <AnalyticsTrendChart
            data={weeklyReport.trend}
            emptyMessage="Weekly trends will appear after meals are saved."
          />
        </article>

        <article className="rounded-lg border border-border-subtle bg-surface p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-950">
              30-day calories and protein
            </h2>
            <p className="text-sm text-slate-600">
              Daily totals across the trailing month.
            </p>
          </div>
          <AnalyticsTrendChart
            data={monthlyReport.trend}
            emptyMessage="Monthly trends will appear after meals are saved."
          />
        </article>
      </section>

      <section className="mt-4 rounded-lg border border-border-subtle bg-surface p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-950">
            Most eaten foods
          </h2>
          <p className="text-sm text-slate-600">
            Ranked by meal count over the trailing 30 days.
          </p>
        </div>
        <MostEatenFoods foods={monthlyReport.mostEatenFoods} />
      </section>
    </main>
  );
}

function ReportSummary({
  title,
  days,
  totals,
}: {
  title: string;
  days: number;
  totals: Record<(typeof reportStats)[number]["key"], number>;
}) {
  const dailyCalories = Math.round(totals.calories / days);

  return (
    <article className="rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-600">{dailyCalories} kcal/day avg</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {reportStats.map((stat) => (
          <div key={stat.key} className="rounded-md bg-surface-muted p-3">
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className={["mt-2 text-xl font-semibold", stat.className].join(" ")}>
              {roundNutritionValue(totals[stat.key])}
              <span className="ml-1 text-xs font-medium text-slate-500">
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
