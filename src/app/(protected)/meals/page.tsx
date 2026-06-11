import { auth } from "@clerk/nextjs/server";
import { ScanLine } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MealHistoryPanel } from "@/features/meals/meal-history-panel";
import { getRecentMeals } from "@/server/meals";

export default async function MealsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const meals = await getRecentMeals(userId, 50);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-8 lg:py-7">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Meals</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-normal text-slate-950">
            Meal history
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search saved scans, filter by time range, inspect nutrition details,
            and remove meals that do not belong in your log.
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

      <MealHistoryPanel meals={meals} />
    </main>
  );
}
