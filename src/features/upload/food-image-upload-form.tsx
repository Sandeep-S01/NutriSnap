"use client";

import { Camera, ImageIcon, Loader2, RotateCcw, Upload, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { analyzeFoodImage } from "@/actions/analyze-food-image";
import { uploadFoodImage } from "@/actions/upload-food-image";
import { FoodAnalysisResultCard } from "@/features/analysis/food-analysis-result";
import { SaveMealButton } from "@/features/meals/save-meal-button";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/features/upload/upload-constants";
import { validateFoodImageFile } from "@/features/upload/upload-validation";
import type { AnalyzeFoodImageState } from "@/types/nutrition";
import type { UploadFoodImageState } from "@/types/upload";

const initialState: UploadFoodImageState = {
  status: "idle",
};

function UploadButton({
  hasFile,
  pending,
}: {
  hasFile: boolean;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={!hasFile || pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Uploading
        </>
      ) : (
        <>
          <Upload className="mr-2 size-4" aria-hidden="true" />
          Upload image
        </>
      )}
    </button>
  );
}

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

export function FoodImageUploadForm() {
  const [state, setState] = useState<UploadFoodImageState>(initialState);
  const [analysisState, setAnalysisState] = useState<AnalyzeFoodImageState>({
    status: "idle",
  });
  const [isPending, startTransition] = useTransition();
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (state.status === "success") {
      setError(null);
    }

    if (state.status === "error") {
      setError(state.message ?? "Upload failed.");
    }
  }, [state]);

  useEffect(() => {
    if (!state.image?.url) return;

    analyzeUploadedImage(state.image.url);
  }, [state.image?.url]);

  function analyzeUploadedImage(imageUrl: string) {
    setAnalysisState({ status: "loading", message: "Analyzing image..." });

    startAnalysisTransition(async () => {
      const nextAnalysisState = await analyzeFoodImage({ imageUrl });
      setAnalysisState(nextAnalysisState);
    });
  }

  function selectFile(file: File | undefined) {
    if (!file) return;

    const validation = validateFoodImageFile(file);

    if (!validation.success) {
      setSelectedFile(null);
      setError(validation.error);
      setAnalysisState({ status: "idle" });
      return;
    }

    setSelectedFile(validation.data);
    setError(null);
    setState(initialState);
    setAnalysisState({ status: "idle" });
  }

  function clearSelection() {
    setSelectedFile(null);
    setError(null);
    setState(initialState);
    setAnalysisState({ status: "idle" });

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Select an image to upload.");
      return;
    }

    const formData = new FormData();
    formData.set("image", selectedFile);

    startTransition(async () => {
      const nextState = await uploadFoodImage(state, formData);
      setState(nextState);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-slate-200 bg-white p-5"
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files[0]);
          }}
          className={[
            "flex min-h-80 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition",
            isDragging
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-300 bg-slate-50",
          ].join(" ")}
        >
          <div className="flex size-14 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
            <ImageIcon className="size-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-950">
            Drop a food image here
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Use your camera, pick from your gallery, or drag an image into this
            upload area.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Camera className="mr-2 size-4" aria-hidden="true" />
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Choose image
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {ACCEPTED_IMAGE_EXTENSIONS.join(", ")} up to{" "}
            {formatMegabytes(MAX_UPLOAD_SIZE_BYTES)}
          </p>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6">
            {selectedFile ? (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="max-w-64 truncate font-medium">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Clear selected image"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {state.status === "success" ? (
              <p className="text-sm text-emerald-700">{state.message}</p>
            ) : null}
          </div>
          <UploadButton hasFile={Boolean(selectedFile)} pending={isPending} />
        </div>
      </form>

      <aside className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-950">Preview</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Selected food"
              width={900}
              height={700}
              className="aspect-[4/3] w-full object-cover"
              unoptimized
            />
          ) : state.image ? (
            <Image
              src={state.image.url}
              alt="Uploaded food"
              width={900}
              height={700}
              className="aspect-[4/3] w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-sm text-slate-500">
              Select an image to preview it before upload.
            </div>
          )}
        </div>

        {state.image ? (
          <div className="mt-4 rounded-md bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-900">
              Uploaded successfully
            </p>
            <p className="mt-1 break-all text-xs leading-5 text-emerald-800">
              {state.image.url}
            </p>
          </div>
        ) : null}
      </aside>

      <div className="lg:col-span-2">
        {analysisState.status === "loading" || isAnalyzing ? (
          <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Analyzing food image with GPT-4o Vision...
            </div>
          </section>
        ) : null}

        {analysisState.status === "error" ? (
          <section className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-900">
              Analysis failed
            </p>
            <p className="mt-2 text-sm text-red-800">
              {analysisState.message}
            </p>
            {state.image?.url ? (
              <button
                type="button"
                onClick={() => analyzeUploadedImage(state.image?.url ?? "")}
                disabled={isAnalyzing}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isAnalyzing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                )}
                Retry analysis
              </button>
            ) : null}
          </section>
        ) : null}

        {analysisState.status === "success" && analysisState.analysis ? (
          <>
            <FoodAnalysisResultCard analysis={analysisState.analysis} />
            {state.image?.url ? (
              <SaveMealButton
                analysis={analysisState.analysis}
                imageUrl={state.image.url}
                rawResponse={analysisState.rawResponse ?? analysisState.analysis}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
