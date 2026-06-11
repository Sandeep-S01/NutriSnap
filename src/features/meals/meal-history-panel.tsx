"use client";

import {
  CalendarDays,
  Loader2,
  Pencil,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import type { Meal } from "@/types/meal";

type MealFilter = "all" | "today" | "week" | "month";
type MealEditForm = {
  foodName: string;
  estimatedWeightGrams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

const filterOptions: { value: MealFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
];

function getDayLabel(createdAt: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(createdAt));
}

function getTimeLabel(createdAt: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

function isWithinFilter(createdAt: string, filter: MealFilter) {
  if (filter === "all") return true;

  const mealDate = new Date(createdAt);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return mealDate >= start;
  }

  const days = filter === "week" ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));

  return mealDate >= start;
}

function groupMealsByDay(meals: Meal[]) {
  const groups = new Map<string, Meal[]>();

  for (const meal of meals) {
    const label = getDayLabel(meal.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), meal]);
  }

  return Array.from(groups.entries());
}

function createEditForm(meal: Meal): MealEditForm {
  return {
    foodName: meal.foodName,
    estimatedWeightGrams: String(Math.round(meal.estimatedWeightGrams * 10) / 10),
    calories: String(Math.round(meal.calories * 10) / 10),
    protein: String(Math.round(meal.protein * 10) / 10),
    carbs: String(Math.round(meal.carbs * 10) / 10),
    fat: String(Math.round(meal.fat * 10) / 10),
    fiber: String(Math.round(meal.fiber * 10) / 10),
  };
}

function parseNonNegativeNumber(value: string, label: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${label} must be a number greater than or equal to 0.`);
  }

  return parsedValue;
}

function buildUpdatePayload(form: MealEditForm) {
  const foodName = form.foodName.trim();

  if (!foodName) {
    throw new Error("Food name is required.");
  }

  return {
    foodName,
    estimatedWeightGrams: parseNonNegativeNumber(
      form.estimatedWeightGrams,
      "Estimated weight",
    ),
    calories: parseNonNegativeNumber(form.calories, "Calories"),
    protein: parseNonNegativeNumber(form.protein, "Protein"),
    carbs: parseNonNegativeNumber(form.carbs, "Carbs"),
    fat: parseNonNegativeNumber(form.fat, "Fat"),
    fiber: parseNonNegativeNumber(form.fiber, "Fiber"),
  };
}

async function deleteMealRequest(mealId: string) {
  const response = await fetch(`/api/meals/${mealId}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as {
    status: "success" | "error";
    message: string;
  };

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message || "Unable to delete meal.");
  }

  return payload;
}

async function updateMealRequest(mealId: string, payload: ReturnType<typeof buildUpdatePayload>) {
  const response = await fetch(`/api/meals/${mealId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responsePayload = (await response.json()) as {
    status: "success" | "error";
    message: string;
    meal?: Meal;
  };

  if (!response.ok || responsePayload.status !== "success" || !responsePayload.meal) {
    throw new Error(responsePayload.message || "Unable to update meal.");
  }

  return responsePayload.meal;
}

function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className={["mt-2 text-2xl font-semibold", tone].join(" ")}>
        {value}
        <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase text-slate-500">
        {label}
      </span>
      <div className="mt-2 flex h-10 overflow-hidden rounded-md border border-border-subtle bg-white focus-within:border-primary">
        <input
          type="number"
          min="0"
          step="0.1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 px-3 text-sm text-slate-950 outline-none"
        />
        <span className="flex items-center border-l border-border-subtle bg-surface-muted px-3 text-xs font-medium text-slate-500">
          {unit}
        </span>
      </div>
    </label>
  );
}

export function MealHistoryPanel({ meals }: { meals: Meal[] }) {
  const [visibleMeals, setVisibleMeals] = useState(meals);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MealFilter>("all");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<MealEditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const filteredMeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleMeals.filter((meal) => {
      const matchesQuery =
        !normalizedQuery ||
        meal.foodName.toLowerCase().includes(normalizedQuery);
      return matchesQuery && isWithinFilter(meal.createdAt, filter);
    });
  }, [filter, query, visibleMeals]);

  const groupedMeals = groupMealsByDay(filteredMeals);

  function openMeal(meal: Meal) {
    setSelectedMeal(meal);
    setIsEditing(false);
    setEditError(null);
    setEditForm(createEditForm(meal));
  }

  function updateEditField(field: keyof MealEditForm, value: string) {
    setEditForm((currentForm) =>
      currentForm ? { ...currentForm, [field]: value } : currentForm,
    );
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditError(null);
    setEditForm(selectedMeal ? createEditForm(selectedMeal) : null);
  }

  function saveEdit() {
    if (!selectedMeal || !editForm) return;

    setEditError(null);

    let payload: ReturnType<typeof buildUpdatePayload>;

    try {
      payload = buildUpdatePayload(editForm);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Review the meal fields and try again.",
      );
      return;
    }

    startSaveTransition(async () => {
      try {
        const updatedMeal = await updateMealRequest(selectedMeal.id, payload);
        setVisibleMeals((currentMeals) =>
          currentMeals.map((meal) =>
            meal.id === updatedMeal.id ? updatedMeal : meal,
          ),
        );
        setSelectedMeal(updatedMeal);
        setEditForm(createEditForm(updatedMeal));
        setIsEditing(false);
      } catch (error) {
        setEditError(
          error instanceof Error
            ? error.message
            : "Unable to update meal. Please try again.",
        );
      }
    });
  }

  function deleteMeal(meal: Meal) {
    setDeleteError(null);
    setDeletingMealId(meal.id);

    startDeleteTransition(async () => {
      try {
        await deleteMealRequest(meal.id);
        setVisibleMeals((currentMeals) =>
          currentMeals.filter((currentMeal) => currentMeal.id !== meal.id),
        );
        setSelectedMeal((currentMeal) =>
          currentMeal?.id === meal.id ? null : currentMeal,
        );
      } catch (error) {
        setDeleteError(
          error instanceof Error
            ? error.message
            : "Unable to delete meal. Please try again.",
        );
      } finally {
        setDeletingMealId(null);
      }
    });
  }

  if (meals.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-surface p-8 text-center">
        <Utensils
          className="mx-auto mb-4 size-6 text-primary"
          aria-hidden="true"
        />
        <h2 className="text-base font-semibold text-slate-950">
          No saved meals yet
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Scan a meal and save the analysis to build your history.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="mb-4 rounded-lg border border-border-subtle bg-surface p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search meals"
              className="h-10 w-full rounded-md border border-border-subtle bg-white pl-9 pr-3 text-sm text-slate-950 outline-none focus:border-primary"
            />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto">
            <SlidersHorizontal
              className="size-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={[
                  "h-10 shrink-0 rounded-md border px-3 text-sm font-semibold",
                  filter === option.value
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border-subtle bg-white text-slate-700 hover:bg-surface-muted",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing {filteredMeals.length} of {visibleMeals.length} saved meals.
        </p>
        {deleteError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        ) : null}
      </section>

      {groupedMeals.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-surface p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">
            No matching meals
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Clear the search or choose a wider date range.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {groupedMeals.map(([day, dayMeals]) => (
            <div
              key={day}
              className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
            >
              <div className="border-b border-border-subtle bg-surface-muted px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-950">{day}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {dayMeals.map((meal) => (
                  <article
                    key={meal.id}
                    className="grid grid-cols-[56px_1fr] gap-3 p-4 sm:grid-cols-[64px_1fr_auto]"
                  >
                    <button
                      type="button"
                      onClick={() => openMeal(meal)}
                      className="overflow-hidden rounded-md bg-slate-100"
                      aria-label={`View ${meal.foodName}`}
                    >
                      <Image
                        src={meal.imageUrl}
                        alt={meal.foodName}
                        width={128}
                        height={128}
                        className="aspect-square h-full w-full object-cover"
                        unoptimized
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => openMeal(meal)}
                      className="min-w-0 text-left"
                    >
                      <h3 className="truncate text-sm font-semibold text-slate-950">
                        {meal.foodName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {getTimeLabel(meal.createdAt)} -{" "}
                        {Math.round(meal.estimatedWeightGrams)}g estimated
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                          {Math.round(meal.protein)}g protein
                        </span>
                        <span className="rounded bg-violet-50 px-2 py-1 text-violet-700">
                          {Math.round(meal.carbs)}g carbs
                        </span>
                        <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">
                          {Math.round(meal.fat)}g fat
                        </span>
                        <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">
                          {Math.round(meal.fiber)}g fiber
                        </span>
                      </div>
                    </button>
                    <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-lg font-semibold text-calories">
                          {Math.round(meal.calories)}
                        </p>
                        <p className="text-xs text-slate-500">kcal</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMeal(meal)}
                        disabled={isDeleting && deletingMealId === meal.id}
                        className="flex size-9 items-center justify-center rounded-md border border-red-100 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Delete ${meal.foodName}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {selectedMeal ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-lg bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase text-primary">
                  Meal details
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedMeal.foodName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMeal(null);
                  setIsEditing(false);
                  setEditError(null);
                }}
                className="flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-surface-muted hover:text-slate-950"
                aria-label="Close meal details"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              <Image
                src={selectedMeal.imageUrl}
                alt={selectedMeal.foodName}
                width={900}
                height={640}
                className="aspect-[4/3] w-full rounded-lg object-cover"
                unoptimized
              />

              {isEditing && editForm ? (
                <div className="mt-4 rounded-lg border border-border-subtle bg-surface-muted p-4">
                  <label className="block">
                    <span className="text-xs font-medium uppercase text-slate-500">
                      Food name
                    </span>
                    <input
                      value={editForm.foodName}
                      onChange={(event) =>
                        updateEditField("foodName", event.target.value)
                      }
                      className="mt-2 h-10 w-full rounded-md border border-border-subtle bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary"
                    />
                  </label>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <NumberField
                      label="Calories"
                      unit="kcal"
                      value={editForm.calories}
                      onChange={(value) => updateEditField("calories", value)}
                    />
                    <NumberField
                      label="Weight"
                      unit="g"
                      value={editForm.estimatedWeightGrams}
                      onChange={(value) =>
                        updateEditField("estimatedWeightGrams", value)
                      }
                    />
                    <NumberField
                      label="Protein"
                      unit="g"
                      value={editForm.protein}
                      onChange={(value) => updateEditField("protein", value)}
                    />
                    <NumberField
                      label="Carbs"
                      unit="g"
                      value={editForm.carbs}
                      onChange={(value) => updateEditField("carbs", value)}
                    />
                    <NumberField
                      label="Fat"
                      unit="g"
                      value={editForm.fat}
                      onChange={(value) => updateEditField("fat", value)}
                    />
                    <NumberField
                      label="Fiber"
                      unit="g"
                      value={editForm.fiber}
                      onChange={(value) => updateEditField("fiber", value)}
                    />
                  </div>

                  {editError ? (
                    <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                      {editError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Metric
                    label="Calories"
                    value={Math.round(selectedMeal.calories)}
                    unit="kcal"
                    tone="text-calories"
                  />
                  <Metric
                    label="Weight"
                    value={Math.round(selectedMeal.estimatedWeightGrams)}
                    unit="g"
                    tone="text-slate-950"
                  />
                  <Metric
                    label="Protein"
                    value={Math.round(selectedMeal.protein * 10) / 10}
                    unit="g"
                    tone="text-protein"
                  />
                  <Metric
                    label="Carbs"
                    value={Math.round(selectedMeal.carbs * 10) / 10}
                    unit="g"
                    tone="text-carbs"
                  />
                  <Metric
                    label="Fat"
                    value={Math.round(selectedMeal.fat * 10) / 10}
                    unit="g"
                    tone="text-fat"
                  />
                  <Metric
                    label="Fiber"
                    value={Math.round(selectedMeal.fiber * 10) / 10}
                    unit="g"
                    tone="text-fiber"
                  />
                </div>
              )}

              <div className="mt-4 rounded-lg border border-border-subtle bg-surface-muted p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <CalendarDays
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  {getDayLabel(selectedMeal.createdAt)} at{" "}
                  {getTimeLabel(selectedMeal.createdAt)}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Confidence: {Math.round(selectedMeal.confidence * 100)}%
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Vitamins and minerals
                </h3>
                {selectedMeal.vitamins.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMeal.vitamins.map((vitamin) => (
                      <span
                        key={`${vitamin.name}-${vitamin.amount}`}
                        className="rounded-md bg-surface-muted px-3 py-2 text-sm text-slate-700"
                      >
                        {vitamin.name}: {vitamin.amount}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    No reliable vitamin estimate was saved for this meal.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2 border-t border-border-subtle p-4 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border-subtle bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="mr-2 size-4" aria-hidden="true" />
                    )}
                    Save changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditForm(createEditForm(selectedMeal));
                      setEditError(null);
                      setIsEditing(true);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border-subtle bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-surface-muted"
                  >
                    <Pencil className="mr-2 size-4" aria-hidden="true" />
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMeal(selectedMeal)}
                    disabled={isDeleting && deletingMealId === selectedMeal.id}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Trash2 className="mr-2 size-4" aria-hidden="true" />
                    Delete meal
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
