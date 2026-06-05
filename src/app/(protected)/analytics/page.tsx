import { auth } from "@clerk/nextjs/server";
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
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
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
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Analytics
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Nutrition trends
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Review weekly and monthly calorie, protein, and meal frequency
            patterns from saved food analyses.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Log another meal
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportSummary title="Weekly report" totals={weeklyReport.totals} />
        <ReportSummary title="Monthly report" totals={monthlyReport.totals} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
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

        <article className="rounded-lg border border-slate-200 bg-white p-5">
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

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
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
  totals,
}: {
  title: string;
  totals: Record<(typeof reportStats)[number]["key"], number>;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {reportStats.map((stat) => (
          <div key={stat.key} className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
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
