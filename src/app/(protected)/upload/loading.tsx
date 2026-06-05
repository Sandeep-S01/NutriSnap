export default function UploadLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-80 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-6 w-full max-w-xl animate-pulse rounded bg-slate-200" />
      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="h-[30rem] animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-[30rem] animate-pulse rounded-lg border border-slate-200 bg-white" />
      </section>
    </main>
  );
}
