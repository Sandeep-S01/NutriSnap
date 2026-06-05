"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ProtectedRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Protected route render failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-2xl items-center px-5 py-12 sm:px-8">
      <section className="rounded-lg border border-red-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Unable to load this page
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The request failed while loading your nutrition data. Try again in a
          moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <RotateCcw className="mr-2 size-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    </main>
  );
}
