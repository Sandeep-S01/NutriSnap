import { FoodImageUploadForm } from "@/features/upload/food-image-upload-form";

export default function UploadPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Food upload
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
          Upload a meal photo
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Add a clear food image from camera, gallery, or drag/drop. The image
          is validated locally and stored in Vercel Blob.
        </p>
      </section>

      <FoodImageUploadForm />
    </main>
  );
}
