"use client";

import { CheckCircle2, Loader2, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useTransition } from "react";
import type { FoodAnalysisResult } from "@/types/nutrition";
import type { MealMutationResult } from "@/types/meal";

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function saveMealWithRetry(
  payload: Record<string, unknown>,
): Promise<MealMutationResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return (await response.json()) as MealMutationResult;
    } catch (error) {
      lastError = error;

      if (attempt === 2) {
        break;
      }

      await wait(500);
    }
  }

  console.error("Save meal request failed", lastError);

  return {
    status: "error",
    message: "Unable to save meal. Please try again.",
  };
}

export function SaveMealButton({
  analysis,
  imageUrl,
  rawResponse,
  variant = "default",
  icon: Icon = Save,
}: {
  analysis: FoodAnalysisResult;
  imageUrl: string;
  rawResponse: unknown;
  variant?: "default" | "mobile";
  icon?: LucideIcon;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<MealMutationResult | null>(null);

  function saveMeal() {
    startTransition(async () => {
      const payload = await saveMealWithRetry({
          ...analysis,
          imageUrl,
          aiRawResponse: rawResponse,
      });
      setResult(payload);
    });
  }

  if (result?.status === "success") {
    return (
      <div
        className={[
          "mt-5 border border-emerald-200 bg-emerald-50 p-4",
          variant === "mobile" ? "rounded-2xl" : "rounded-lg",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Meal saved
        </div>
        <p className="mt-1 text-sm text-emerald-800">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={saveMeal}
        disabled={isPending}
        className={[
          "inline-flex items-center justify-center bg-emerald-700 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300",
          variant === "mobile"
            ? "h-16 w-full rounded-xl px-5 text-lg shadow-[0_18px_35px_rgba(4,120,87,0.22)]"
            : "h-11 rounded-md px-4 text-sm",
        ].join(" ")}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
            Saving meal
          </>
        ) : (
          <>
            <Icon
              className={variant === "mobile" ? "mr-2 size-6" : "mr-2 size-4"}
              aria-hidden="true"
            />
            {variant === "mobile" ? "Log Meal" : "Save meal"}
          </>
        )}
      </button>
      {result?.status === "error" ? (
        <p className="mt-2 text-sm text-red-600">{result.message}</p>
      ) : null}
    </div>
  );
}
