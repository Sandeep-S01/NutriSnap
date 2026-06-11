import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { FoodAnalysisResult } from "@/types/nutrition";

const macroItems = [
  { key: "protein", label: "Protein", unit: "g", className: "text-protein" },
  { key: "carbs", label: "Carbs", unit: "g", className: "text-carbs" },
  { key: "fat", label: "Fat", unit: "g", className: "text-fat" },
  { key: "fiber", label: "Fiber", unit: "g", className: "text-fiber" },
] as const;

export function FoodAnalysisResultCard({
  analysis,
}: {
  analysis: FoodAnalysisResult;
}) {
  const isLowConfidence = analysis.confidence < 0.5;
  const isMediumConfidence = analysis.confidence >= 0.5 && analysis.confidence < 0.75;
  const confidenceLabel = isLowConfidence
    ? "Review before saving"
    : isMediumConfidence
      ? "Estimate looks plausible"
      : "High confidence";

  return (
    <section className="mt-4 rounded-lg border border-border-subtle bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            Analysis result
          </p>
          <h2 className="mt-2 text-[28px] font-semibold leading-tight text-slate-950">
            {analysis.foodName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Estimated weight: {Math.round(analysis.estimatedWeightGrams)}g
          </p>
        </div>
        <div
          className={[
            "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold",
            isLowConfidence
              ? "bg-amber-50 text-amber-800"
              : isMediumConfidence
                ? "bg-blue-50 text-blue-800"
                : "bg-primary-soft text-emerald-800",
          ].join(" ")}
        >
          {isLowConfidence ? (
            <AlertTriangle className="mr-2 size-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
          )}
          {Math.round(analysis.confidence * 100)}% · {confidenceLabel}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-primary-soft p-4">
        <p className="text-sm font-medium text-emerald-800">Calories</p>
        <p className="mt-1 text-[28px] font-semibold text-emerald-950">
          {Math.round(analysis.calories)}
          <span className="ml-2 text-base font-medium text-emerald-800">
            kcal
          </span>
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {macroItems.map((item) => (
          <div
            key={item.key}
            className="rounded-lg border border-border-subtle bg-surface-muted p-3"
          >
            <p className="text-sm text-slate-600">{item.label}</p>
            <p className={["mt-2 text-xl font-semibold", item.className].join(" ")}>
              {Math.round(analysis[item.key] * 10) / 10}
              <span className="ml-1 text-sm font-medium text-slate-500">
                {item.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-950">
          Vitamins and minerals
        </h3>
        {analysis.vitamins.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.vitamins.map((vitamin) => (
              <span
                key={`${vitamin.name}-${vitamin.amount}`}
                className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                {vitamin.name}: {vitamin.amount}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            No reliable vitamin estimate was returned.
          </p>
        )}
      </div>
    </section>
  );
}
