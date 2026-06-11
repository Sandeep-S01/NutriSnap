"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import type { UserPreference } from "@/types/preferences";

type PreferenceApiResponse =
  | {
      status: "success";
      message?: string;
      preference: UserPreference;
    }
  | {
      status: "error";
      message: string;
      issues?: Record<string, string[] | undefined>;
    };

function parsePositiveNumber(value: string, label: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }

  return parsedValue;
}

async function savePreference(payload: UserPreference) {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as PreferenceApiResponse;

  if (!response.ok || data.status !== "success") {
    throw new Error(
      data.status === "error"
        ? data.message
        : "Unable to update nutrition goals.",
    );
  }

  return data.preference;
}

export function NutritionGoalsForm({
  initialPreference,
}: {
  initialPreference: UserPreference;
}) {
  const [dailyCaloriesTarget, setDailyCaloriesTarget] = useState(
    String(Math.round(initialPreference.dailyCaloriesTarget)),
  );
  const [dailyProteinTarget, setDailyProteinTarget] = useState(
    String(Math.round(initialPreference.dailyProteinTarget)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    setError(null);

    let payload: UserPreference;

    try {
      payload = {
        dailyCaloriesTarget: parsePositiveNumber(
          dailyCaloriesTarget,
          "Daily calorie target",
        ),
        dailyProteinTarget: parsePositiveNumber(
          dailyProteinTarget,
          "Daily protein target",
        ),
      };
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Review your nutrition goals and try again.",
      );
      return;
    }

    startTransition(async () => {
      try {
        const preference = await savePreference(payload);
        setDailyCaloriesTarget(String(Math.round(preference.dailyCaloriesTarget)));
        setDailyProteinTarget(String(Math.round(preference.dailyProteinTarget)));
        setMessage("Nutrition goals updated.");
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Unable to update nutrition goals.",
        );
      }
    });
  }

  return (
    <section className="mb-4 rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Nutrition goals
          </h2>
          <p className="text-sm text-slate-600">
            Set daily targets used by the Today dashboard.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase text-slate-500">
            Daily calories
          </span>
          <div className="mt-2 flex h-10 overflow-hidden rounded-md border border-border-subtle bg-white focus-within:border-primary">
            <input
              type="number"
              min="1"
              step="1"
              value={dailyCaloriesTarget}
              onChange={(event) => setDailyCaloriesTarget(event.target.value)}
              className="min-w-0 flex-1 px-3 text-sm text-slate-950 outline-none"
            />
            <span className="flex items-center border-l border-border-subtle bg-surface-muted px-3 text-xs font-medium text-slate-500">
              kcal
            </span>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase text-slate-500">
            Daily protein
          </span>
          <div className="mt-2 flex h-10 overflow-hidden rounded-md border border-border-subtle bg-white focus-within:border-primary">
            <input
              type="number"
              min="1"
              step="1"
              value={dailyProteinTarget}
              onChange={(event) => setDailyProteinTarget(event.target.value)}
              className="min-w-0 flex-1 px-3 text-sm text-slate-950 outline-none"
            />
            <span className="flex items-center border-l border-border-subtle bg-surface-muted px-3 text-xs font-medium text-slate-500">
              g
            </span>
          </div>
        </label>
      </div>

      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-md bg-primary-soft px-3 py-2 text-sm text-primary">
          {message}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 size-4" aria-hidden="true" />
          )}
          Save goals
        </button>
      </div>
    </section>
  );
}
