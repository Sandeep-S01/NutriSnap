import { auth } from "@clerk/nextjs/server";
import { BarChart3, Camera, CheckCircle2, ScanLine, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { NutriSnapLogo } from "@/components/nutrisnap-logo";

const productSteps = [
  {
    icon: ScanLine,
    title: "Scan a meal",
    description: "Use camera or image upload to capture a clear food photo.",
  },
  {
    icon: CheckCircle2,
    title: "Review nutrition",
    description: "See calories, macros, fiber, vitamins, weight, and confidence.",
  },
  {
    icon: BarChart3,
    title: "Track patterns",
    description: "Save meals into Today, Meals, and Insights for repeat use.",
  },
];

const previewMeals: { name: string; calories: string; icon: LucideIcon }[] = [
  { name: "Avocado toast", calories: "385 kcal", icon: Utensils },
  { name: "Chicken rice bowl", calories: "640 kcal", icon: Utensils },
  { name: "Greek yogurt", calories: "210 kcal", icon: Utensils },
];

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-8">
        <header className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <NutriSnapLogo markClassName="size-9" />
          </Link>
          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Create account
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Open app
              </Link>
            )}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:py-12">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase text-primary">
              AI nutrition tracking
            </p>
            <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-normal text-slate-950 sm:text-5xl">
              Scan food and build a reliable meal history.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              NutriSnap turns meal photos into nutrition estimates, then keeps
              your daily intake, saved meals, and longer-term trends in one
              private workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={isSignedIn ? "/upload" : "/sign-up"}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <Camera className="mr-2 size-4" aria-hidden="true" />
                {isSignedIn ? "Scan meal" : "Start tracking"}
              </Link>
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-in"}
                className="inline-flex h-11 items-center justify-center rounded-md border border-border-subtle bg-surface px-4 text-sm font-semibold text-slate-800 hover:bg-surface-muted"
              >
                {isSignedIn ? "View Today" : "Sign in"}
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
            <div className="rounded-md border border-border-subtle bg-surface-muted p-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Today&apos;s nutrition
                  </p>
                  <p className="mt-1 text-xs text-slate-500">3 saved meals</p>
                </div>
                <span className="rounded-md bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  Live log
                </span>
              </div>
              <div className="grid gap-3 py-4 sm:grid-cols-4">
                {[
                  ["Calories", "1,420", "kcal", "text-calories"],
                  ["Protein", "86", "g", "text-protein"],
                  ["Carbs", "154", "g", "text-carbs"],
                  ["Fat", "42", "g", "text-fat"],
                ].map(([label, value, unit, color]) => (
                  <div key={label} className="rounded-md bg-white p-3">
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className={`mt-2 text-xl font-semibold ${color}`}>
                      {value}
                      <span className="ml-1 text-xs text-slate-500">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {previewMeals.map(({ name, calories, icon: Icon }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-md bg-primary-soft text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-slate-950">
                        {name}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600">{calories}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 pb-10 sm:grid-cols-3">
          {productSteps.map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-border-subtle bg-surface p-4"
            >
              <item.icon className="mb-4 size-[18px] text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
