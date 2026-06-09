"use client";

import {
  Camera,
  ImageIcon,
  Loader2,
  RotateCcw,
  ScanLine,
  Upload,
  X,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { analyzeFoodImage } from "@/actions/analyze-food-image";
import { FoodAnalysisResultCard } from "@/features/analysis/food-analysis-result";
import { MobileFoodAnalysisResult } from "@/features/analysis/mobile-food-analysis-result";
import { SaveMealButton } from "@/features/meals/save-meal-button";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  CLIENT_IMAGE_COMPRESSION_MAX_DIMENSION,
  CLIENT_IMAGE_COMPRESSION_MAX_MB,
  MAX_SERVER_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/features/upload/upload-constants";
import { validateFoodImageFile } from "@/features/upload/upload-validation";
import type { AnalyzeFoodImageState } from "@/types/nutrition";
import type { UploadFoodImageState } from "@/types/upload";

const initialState: UploadFoodImageState = {
  status: "idle",
};

const UPLOAD_TIMEOUT_MS = 60_000;
const ANALYSIS_TIMEOUT_MS = 75_000;
const MOBILE_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 1600 },
  },
  audio: false,
};

function createTimeoutError(message: string) {
  return new DOMException(message, "TimeoutError");
}

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  message: string,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort(createTimeoutError(message));
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } finally {
    window.clearTimeout(timeout);
  }
}

function getClientUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to upload image. Please try again.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("client token") || message.includes("token")) {
    return "Image storage is not configured correctly.";
  }

  if (message.includes("too large") || message.includes("size")) {
    return "Image upload is too large. Choose a smaller image and try again.";
  }

  if (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    message.includes("timeout") ||
    message.includes("aborted")
  ) {
    return "Image upload took too long. Please check your connection and try again.";
  }

  if (message.includes("unauthorized") || message.includes("401")) {
    return "Your session expired. Please sign in again and retry.";
  }

  return "Unable to upload image. Please try again.";
}

async function compressImageForUpload(file: File) {
  const compressedBlob = await imageCompression(file, {
    maxSizeMB: CLIENT_IMAGE_COMPRESSION_MAX_MB,
    maxWidthOrHeight: CLIENT_IMAGE_COMPRESSION_MAX_DIMENSION,
    useWebWorker: true,
    initialQuality: 0.82,
    fileType: file.type,
  });

  const compressedFile = new File([compressedBlob], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });

  if (compressedFile.size > MAX_SERVER_UPLOAD_SIZE_BYTES) {
    throw new Error("Image is too large after compression.");
  }

  return compressedFile;
}

async function uploadImageToServer(file: File, signal: AbortSignal) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    signal,
  });

  const payload = (await response.json()) as UploadFoodImageState;

  if (!response.ok || payload.status !== "success") {
    throw new Error(
      payload.status === "error"
        ? payload.message
        : "Unable to upload image. Please try again.",
    );
  }

  return payload;
}

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
  const [isMobileScanner, setIsMobileScanner] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "starting" | "ready" | "error"
  >("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mobileGalleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hasCompletedMobileAnalysis =
    analysisState.status === "success" &&
    Boolean(analysisState.analysis) &&
    Boolean(state.image?.url);

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

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");

    function syncScannerMode() {
      setIsMobileScanner(query.matches);
    }

    syncScannerMode();
    query.addEventListener("change", syncScannerMode);

    return () => query.removeEventListener("change", syncScannerMode);
  }, []);

  useEffect(() => {
    if (!isMobileScanner || hasCompletedMobileAnalysis) {
      stopCameraStream();
      return;
    }

    let cancelled = false;

    async function startCameraStream() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("error");
        setCameraError("Camera is not available in this browser.");
        return;
      }

      setCameraStatus("starting");
      setCameraError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          MOBILE_CAMERA_CONSTRAINTS,
        );

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setCameraStatus("ready");
      } catch (cameraAccessError) {
        console.error("Camera access failed", cameraAccessError);
        setCameraStatus("error");
        setCameraError(
          "Camera permission is blocked. Use Upload image or allow camera access.",
        );
      }
    }

    startCameraStream();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [isMobileScanner, hasCompletedMobileAnalysis]);

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function analyzeUploadedImage(imageUrl: string) {
    setAnalysisState({ status: "loading", message: "Analyzing image..." });

    startAnalysisTransition(async () => {
      try {
        const nextAnalysisState = await withTimeout(
          () => analyzeFoodImage({ imageUrl }),
          ANALYSIS_TIMEOUT_MS,
          "Food analysis timed out.",
        );
        setAnalysisState(nextAnalysisState);
      } catch (analysisError) {
        console.error("Food image analysis request failed", analysisError);
        setAnalysisState({
          status: "error",
          message:
            "Food analysis took too long. Please retry with a clearer or smaller image.",
        });
      }
    });
  }

  function selectFile(file: File | undefined, options?: { autoUpload?: boolean }) {
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

    if (options?.autoUpload) {
      uploadSelectedFile(validation.data);
    }
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

    if (mobileGalleryInputRef.current) {
      mobileGalleryInputRef.current.value = "";
    }
  }

  function uploadSelectedFile(file: File) {
    setError(null);

    startTransition(async () => {
      try {
        const uploadState = await withTimeout(
          (signal) =>
            compressImageForUpload(file).then((compressedFile) =>
              uploadImageToServer(compressedFile, signal),
            ),
          UPLOAD_TIMEOUT_MS,
          "Image upload timed out.",
        );

        setState(uploadState);
      } catch (uploadError) {
        console.error("Food image upload request failed", uploadError);
        setState({
          status: "error",
          message: getClientUploadErrorMessage(uploadError),
        });
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Select an image to upload.");
      return;
    }

    uploadSelectedFile(selectedFile);
  }

  async function captureCameraFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || cameraStatus !== "ready") {
      setError("Camera is not ready yet.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setError("Camera preview is still loading.");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );

    if (!blob) {
      setError("Unable to capture camera image.");
      return;
    }

    const file = new File([blob], `nutrisnap-scan-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    selectFile(file, { autoUpload: true });
  }

  const isProcessing =
    isPending || isAnalyzing || analysisState.status === "loading";

  return (
    <>
      {hasCompletedMobileAnalysis &&
      analysisState.analysis &&
      state.image?.url ? (
        <MobileFoodAnalysisResult
          analysis={analysisState.analysis}
          imageUrl={state.image.url}
          rawResponse={analysisState.rawResponse ?? analysisState.analysis}
          onBack={clearSelection}
        />
      ) : null}

      <section
        className={[
          "fixed inset-0 z-20 overflow-hidden bg-slate-950 lg:hidden",
          hasCompletedMobileAnalysis ? "hidden" : "",
        ].join(" ")}
      >
        <div className="absolute inset-0">
          {previewUrl && isProcessing ? (
            <Image
              src={previewUrl}
              alt="Food scan preview"
              fill
              className="object-cover"
              unoptimized
              priority
            />
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-9 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-950/75 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-xl backdrop-blur">
            <span
              className={[
                "size-3 rounded-full",
                isProcessing || cameraStatus === "ready"
                  ? "bg-emerald-400"
                  : "bg-amber-300",
              ].join(" ")}
            />
            {isProcessing ? "Analyzing..." : "Scanning..."}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-8 top-[18%] h-[42%]">
          <div className="absolute left-0 top-0 size-16 border-l-4 border-t-4 border-emerald-400" />
          <div className="absolute right-0 top-0 size-16 border-r-4 border-t-4 border-emerald-400" />
          <div className="absolute bottom-0 left-0 size-16 border-b-4 border-l-4 border-emerald-400" />
          <div className="absolute bottom-0 right-0 size-16 border-b-4 border-r-4 border-emerald-400" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-400/80" />
        </div>

        <div className="absolute inset-x-5 bottom-28 space-y-3">
          {cameraStatus === "error" || error || state.status === "error" ? (
            <div className="rounded-2xl bg-white/95 p-4 text-sm text-red-700 shadow-lg backdrop-blur">
              {error ?? state.message ?? cameraError}
            </div>
          ) : null}

          {state.status === "success" || analysisState.status === "loading" ? (
            <div className="rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-slate-950">
                {analysisState.status === "loading"
                  ? "Analyzing your meal"
                  : "Image uploaded"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Keep this screen open while NutriSnap estimates nutrition.
              </p>
            </div>
          ) : null}

          {analysisState.status === "error" ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 shadow-lg">
              <p className="font-semibold">Analysis failed</p>
              <p className="mt-1">{analysisState.message}</p>
              {state.image?.url ? (
                <button
                  type="button"
                  onClick={() => analyzeUploadedImage(state.image?.url ?? "")}
                  className="mt-3 inline-flex h-10 items-center rounded-full bg-red-700 px-4 font-semibold text-white"
                >
                  <RotateCcw className="mr-2 size-4" aria-hidden="true" />
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+5.75rem)] pt-4 shadow-[0_-12px_35px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-5">
            <button
              type="button"
              onClick={() => mobileGalleryInputRef.current?.click()}
              disabled={isProcessing}
              className="flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 disabled:opacity-50"
            >
              <ImageIcon className="mr-2 size-4" aria-hidden="true" />
              Upload
            </button>

            <button
              type="button"
              onClick={captureCameraFrame}
              disabled={cameraStatus !== "ready" || isProcessing}
              className="flex size-20 items-center justify-center rounded-full border-[6px] border-white bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(34,197,94,0.22),0_18px_35px_rgba(4,120,87,0.4)] disabled:bg-slate-300 disabled:shadow-none"
              aria-label="Scan food"
            >
              {isProcessing ? (
                <Loader2 className="size-8 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-8" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                clearSelection();
                setCameraStatus(streamRef.current ? "ready" : "idle");
                setCameraError(null);
              }}
              disabled={isProcessing}
              className="flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 disabled:opacity-50"
            >
              <ScanLine className="mr-2 size-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        <input
          ref={mobileGalleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) =>
            selectFile(event.target.files?.[0], { autoUpload: true })
          }
        />
        <canvas ref={canvasRef} className="hidden" />
      </section>

      <div
        className={[
          "hidden gap-5 lg:grid lg:grid-cols-[1fr_0.85fr]",
          hasCompletedMobileAnalysis ? "hidden lg:grid" : "",
        ].join(" ")}
      >
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
              Analyzing food image with Gemini Vision...
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
    </>
  );
}
