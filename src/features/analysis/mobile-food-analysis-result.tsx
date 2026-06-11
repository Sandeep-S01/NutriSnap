"use client";

import {
  ArrowLeft,
  Beef,
  CirclePlus,
  Droplet,
  Heart,
  SunMedium,
  Wheat,
} from "lucide-react";
import Image from "next/image";
import { SaveMealButton } from "@/features/meals/save-meal-button";
import type { FoodAnalysisResult, VitaminAmount } from "@/types/nutrition";

const macroItems = [
  {
    key: "protein",
    label: "Protein",
    icon: Beef,
    valueClassName: "text-protein",
    bgClassName: "bg-blue-50",
  },
  {
    key: "carbs",
    label: "Carbs",
    icon: Wheat,
    valueClassName: "text-carbs",
    bgClassName: "bg-violet-50",
  },
  {
    key: "fat",
    label: "Fats",
    icon: Droplet,
    valueClassName: "text-fat",
    bgClassName: "bg-rose-50",
  },
] as const;

function getVitaminTone(vitamin: VitaminAmount) {
  const text = `${vitamin.name} ${vitamin.amount}`.toLowerCase();

  if (
    text.includes("high") ||
    text.includes("rich") ||
    text.includes("good") ||
    text.includes("vitamin d")
  ) {
    return "High";
  }

  if (text.includes("low") || text.includes("limited")) {
    return "Low";
  }

  return "Optimal";
}

function getVitaminSubtitle(vitaminName: string) {
  const name = vitaminName.toLowerCase();

  if (name.includes("omega")) return "Heart and brain function";
  if (name.includes("vitamin d")) return "Bone health and immunity";
  if (name.includes("vitamin c")) return "Immune support";
  if (name.includes("iron")) return "Energy and oxygen transport";
  if (name.includes("calcium")) return "Bone and muscle support";
  if (name.includes("potassium")) return "Hydration and muscle support";

  return "Estimated from this meal";
}

function getVisibleVitamins(vitamins: VitaminAmount[]) {
  if (vitamins.length > 0) {
    return vitamins.slice(0, 3);
  }

  return [
    { name: "Vitamin estimate", amount: "Not available" },
    { name: "Minerals", amount: "Not available" },
  ];
}

export function MobileFoodAnalysisResult({
  analysis,
  imageUrl,
  rawResponse,
  onBack,
}: {
  analysis: FoodAnalysisResult;
  imageUrl: string;
  rawResponse: unknown;
  onBack: () => void;
}) {
  const confidence = Math.round(analysis.confidence * 100);
  const visibleVitamins = getVisibleVitamins(analysis.vitamins);
  const confidenceLabel =
    analysis.confidence < 0.5
      ? "Review before saving"
      : analysis.confidence < 0.75
        ? "Estimate looks plausible"
        : "High confidence";

  return (
    <section className="fixed inset-0 z-30 overflow-y-auto bg-background px-5 pb-32 pt-6 lg:hidden">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex size-10 shrink-0 items-center justify-center rounded-md text-slate-950 hover:bg-white"
            aria-label="Back to upload"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-semibold tracking-normal text-slate-950">
            Analysis result
          </h1>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-lg border border-border-subtle bg-surface">
          <Image
            src={imageUrl}
            alt={analysis.foodName}
            width={900}
            height={720}
            className="aspect-[1.18/1] w-full object-cover"
            unoptimized
            priority
          />
          <div className="absolute bottom-4 left-4 max-w-[82%] rounded-md bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
            <p className="truncate text-base font-medium text-slate-950">
              {analysis.foodName}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {confidence}% · {confidenceLabel}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border-subtle bg-surface px-5 py-5 text-center">
          <p className="text-xs font-semibold uppercase text-slate-500">
            Total Calories
          </p>
          <p className="mt-2 text-[40px] font-semibold leading-none text-calories">
            {Math.round(analysis.calories)}
            <span className="ml-2 align-middle text-base font-semibold text-slate-600">
              kcal
            </span>
          </p>
        </div>

        <h2 className="mt-5 text-base font-semibold text-slate-950">
          Macronutrients
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {macroItems.map((item) => {
            const value = Math.round(analysis[item.key] * 10) / 10;

            return (
              <div
                key={item.key}
                className="rounded-lg border border-border-subtle bg-surface px-3 py-4 text-center"
              >
                <div
                  className={[
                    "mx-auto flex size-10 items-center justify-center rounded-md",
                    item.bgClassName,
                  ].join(" ")}
                >
                  <item.icon
                    className={["size-5", item.valueClassName].join(" ")}
                    aria-hidden="true"
                  />
                </div>
                <p
                  className={[
                    "mt-3 text-xl font-semibold leading-none",
                    item.valueClassName,
                  ].join(" ")}
                >
                  {value}g
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            );
          })}
        </div>

        <h2 className="mt-5 text-base font-semibold text-slate-950">
          Key Micronutrients
        </h2>
        <div className="mt-3 space-y-3">
          {visibleVitamins.map((vitamin, index) => {
            const label = getVitaminTone(vitamin);
            const Icon = index % 2 === 0 ? SunMedium : Heart;

            return (
              <div
                key={`${vitamin.name}-${vitamin.amount}`}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-slate-800">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-950">
                    {vitamin.name}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {getVitaminSubtitle(vitamin.name)}
                  </p>
                </div>
                <span className="rounded-md bg-primary-soft px-3 py-2 text-xs font-semibold text-primary">
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <SaveMealButton
          analysis={analysis}
          imageUrl={imageUrl}
          rawResponse={rawResponse}
          variant="mobile"
          icon={CirclePlus}
        />
      </div>
    </section>
  );
}
