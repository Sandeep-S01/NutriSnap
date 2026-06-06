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
    valueClassName: "text-emerald-800",
    ringClassName: "border-emerald-700",
  },
  {
    key: "carbs",
    label: "Carbs",
    icon: Wheat,
    valueClassName: "text-blue-600",
    ringClassName: "border-blue-500",
  },
  {
    key: "fat",
    label: "Fats",
    icon: Droplet,
    valueClassName: "text-orange-500",
    ringClassName: "border-orange-400",
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

  return (
    <section className="fixed inset-0 z-30 overflow-y-auto bg-slate-50 px-5 pb-32 pt-6 lg:hidden">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-950 hover:bg-white"
            aria-label="Back to upload"
          >
            <ArrowLeft className="size-6" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-semibold tracking-normal text-slate-950">
            Nutritional Analysis
          </h1>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
          <Image
            src={imageUrl}
            alt={analysis.foodName}
            width={900}
            height={720}
            className="aspect-[1.18/1] w-full object-cover"
            unoptimized
            priority
          />
          <div className="absolute bottom-5 left-5 max-w-[78%] rounded-xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
            <p className="truncate text-base font-medium text-slate-950">
              {analysis.foodName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Confidence: {confidence}%
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-700">
            Total Calories
          </p>
          <p className="mt-2 text-6xl font-semibold leading-none text-emerald-800">
            {Math.round(analysis.calories)}
            <span className="ml-2 align-middle text-2xl font-semibold text-slate-600">
              kcal
            </span>
          </p>
        </div>

        <h2 className="mt-7 text-lg font-medium text-slate-950">
          Macronutrients
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-4">
          {macroItems.map((item) => {
            const value = Math.round(analysis[item.key] * 10) / 10;

            return (
              <div
                key={item.key}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-5 text-center shadow-sm"
              >
                <div
                  className={[
                    "mx-auto flex size-16 items-center justify-center rounded-full border-[7px] border-b-slate-100 border-l-slate-100 bg-white",
                    item.ringClassName,
                  ].join(" ")}
                >
                  <item.icon
                    className={["size-6", item.valueClassName].join(" ")}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-4 text-2xl font-semibold leading-none text-slate-950">
                  {value}g
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </div>
            );
          })}
        </div>

        <h2 className="mt-8 text-lg font-medium text-slate-950">
          Key Micronutrients
        </h2>
        <div className="mt-5 space-y-4">
          {visibleVitamins.map((vitamin, index) => {
            const label = getVitaminTone(vitamin);
            const Icon = index % 2 === 0 ? SunMedium : Heart;

            return (
              <div
                key={`${vitamin.name}-${vitamin.amount}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-slate-800">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-950">
                    {vitamin.name}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {getVitaminSubtitle(vitamin.name)}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-950">
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
