import { auth } from "@clerk/nextjs/server";
import { Database, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { NutriSnapLogo } from "@/components/nutrisnap-logo";

const setupItems = [
  {
    icon: Database,
    title: "PostgreSQL + Prisma",
    description: "Datasource and generated client are configured for Phase 5.",
  },
  {
    icon: ShieldCheck,
    title: "Clerk Auth",
    description: "Sign up, sign in, profile, and protected routes are enabled.",
  },
  {
    icon: KeyRound,
    title: "Protected App Shell",
    description: "Dashboard and profile routes require an authenticated user.",
  },
  {
    icon: Sparkles,
    title: "Ready for Upload",
    description: "Food upload and AI analysis begin in the next phases.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-6 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NutriSnapLogo markClassName="size-10" />
          <div>
            <p className="text-sm text-muted-foreground">Phase 2 auth</p>
          </div>
        </div>
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
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Sign up
            </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1fr_0.8fr]">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Authenticated MVP foundation
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            Secure meal tracking starts with a private workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            NutriSnap now supports Clerk signup, login, user profile management,
            protected dashboard routes, and middleware enforcement.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!isSignedIn ? (
              <>
              <Link
                href="/sign-up"
                className="rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Create account
              </Link>
              <Link
                href="/sign-in"
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Sign in
              </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Open dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="aspect-[4/3] rounded-md bg-[radial-gradient(circle_at_30%_20%,#bbf7d0,transparent_32%),linear-gradient(135deg,#f8fafc,#ecfdf5)] p-5">
            <div className="flex h-full flex-col justify-between">
              <div className="rounded-md bg-white/80 p-3 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-900">
                  Access control
                </p>
                <p className="mt-1 text-3xl font-semibold text-emerald-700">
                  Protected
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["Signup", "Login", "Profile", "Middleware"].map((item) => (
                  <div
                    key={item}
                    className="rounded-md bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        {setupItems.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <item.icon
              className="mb-4 size-5 text-emerald-700"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-slate-950">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
