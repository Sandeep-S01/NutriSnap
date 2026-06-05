export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-6 w-full max-w-xl animate-pulse rounded bg-slate-200" />
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </section>
      <div className="mt-6 h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
    </main>
  );
}
