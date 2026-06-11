import { FoodImageUploadForm } from "@/features/upload/food-image-upload-form";

export default function UploadPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-8 lg:py-7">
      <section className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
        <p className="text-xs font-semibold uppercase text-primary">
          Scan
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-normal text-slate-950">
          Capture a meal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Take or upload a clear food photo. NutriSnap estimates nutrition and
          lets you save the result to your private meal log.
        </p>
        </div>
        <p className="rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs font-medium text-slate-600">
          JPG, PNG, WebP · max 10MB
        </p>
      </section>

      <FoodImageUploadForm />
    </main>
  );
}
