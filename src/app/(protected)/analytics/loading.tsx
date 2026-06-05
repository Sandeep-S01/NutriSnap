export default function AnalyticsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-6 w-full max-w-xl animate-pulse rounded bg-slate-200" />
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </section>
    </main>
  );
}
