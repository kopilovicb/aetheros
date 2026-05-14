"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type {
  MealTimingQuality,
  NutritionLog,
  ProteinAdequacy,
} from "@/types/models";

type NutritionFormState = {
  mealQuality: number;
  hydrationLiters: number;
  caffeineIntake: string;
  mealTiming: MealTimingQuality;
  proteinAdequacy: ProteinAdequacy;
  junkFoodToday: boolean;
  energyStability: number;
  notes: string;
};

const DEFAULT_FORM_STATE: NutritionFormState = {
  mealQuality: 7,
  hydrationLiters: 2.5,
  caffeineIntake: "0",
  mealTiming: "good",
  proteinAdequacy: "medium",
  junkFoodToday: false,
  energyStability: 7,
  notes: "",
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function SliderField({
  label,
  max,
  min,
  step,
  value,
  valueLabel,
  onChange,
}: {
  label: string;
  max: number;
  min: number;
  step?: number;
  value: number;
  valueLabel?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-[#f9fafb]">{label}</Label>
        <span className="rounded bg-[#111111] px-2 py-1 text-sm text-[#f9fafb]">
          {valueLabel ?? value}
        </span>
      </div>
      <input
        className="w-full accent-[#6366f1]"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function ToggleGroup<TValue extends string>({
  options,
  value,
  onChange,
}: {
  options: TValue[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          className={`rounded-md border px-3 py-2 text-sm capitalize ${
            option === value
              ? "border-[#6366f1] bg-[#6366f1] text-white"
              : "border-[#2a2a2a] bg-[#111111] text-[#9ca3af]"
          }`}
          key={option}
          type="button"
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function NutritionForm() {
  const { user } = useUserStore();
  const today = getTodayDate();
  const [existingLog, setExistingLog] = useState<NutritionLog | null>(null);
  const [formState, setFormState] =
    useState<NutritionFormState>(DEFAULT_FORM_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void db.nutritionLogs
      .where("date")
      .equals(today)
      .first()
      .then((log) => {
        if (!isMounted) {
          return;
        }

        if (log) {
          setExistingLog(log);
          setFormState({
            mealQuality: log.mealQuality,
            hydrationLiters: log.hydrationLiters,
            caffeineIntake: String(log.caffeineIntake),
            mealTiming: log.mealTiming,
            proteinAdequacy: log.proteinAdequacy,
            junkFoodToday: log.junkFoodToday,
            energyStability: log.energyStability,
            notes: log.notes,
          });
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [today]);

  const updateFormState = (updates: Partial<NutritionFormState>) => {
    setFormState((currentState) => ({ ...currentState, ...updates }));
  };

  const submitNutrition = async () => {
    const log: NutritionLog = {
      id: existingLog?.id ?? crypto.randomUUID(),
      userId: existingLog?.userId ?? user?.id ?? "guest",
      date: today,
      mealQuality: formState.mealQuality,
      hydrationLiters: formState.hydrationLiters,
      caffeineIntake: Number(formState.caffeineIntake) || 0,
      mealTiming: formState.mealTiming,
      proteinAdequacy: formState.proteinAdequacy,
      junkFoodToday: formState.junkFoodToday,
      energyStability: formState.energyStability,
      notes: formState.notes,
    };

    if (existingLog) {
      await db.nutritionLogs.put(log);
      await addToSyncQueue("nutrition_logs", "update", { ...log });
    } else {
      await db.nutritionLogs.add(log);
      await addToSyncQueue("nutrition_logs", "insert", { ...log });
    }

    setExistingLog(log);
    setSuccessMessage("Nutrition logged!");
    window.setTimeout(() => setSuccessMessage(null), 1800);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading nutrition log...
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <header>
        <p className="text-sm text-[#9ca3af]">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#f9fafb]">
          {existingLog ? "Edit Today's Log" : "Log Today's Nutrition"}
        </h1>
      </header>

      <SliderField
        label="Overall meal quality today"
        max={10}
        min={0}
        value={formState.mealQuality}
        onChange={(mealQuality) => updateFormState({ mealQuality })}
      />
      <SliderField
        label="Water intake"
        max={5}
        min={0}
        step={0.25}
        value={formState.hydrationLiters}
        valueLabel={`${formState.hydrationLiters}L`}
        onChange={(hydrationLiters) => updateFormState({ hydrationLiters })}
      />

      <div className="space-y-2">
        <Label htmlFor="caffeine">Caffeine (mg)</Label>
        <Input
          id="caffeine"
          max="1000"
          min="0"
          type="number"
          value={formState.caffeineIntake}
          onChange={(event) =>
            updateFormState({ caffeineIntake: event.target.value })
          }
        />
        <p className="text-xs text-[#6b7280]">Coffee ~95mg, Espresso ~63mg</p>
      </div>

      <div className="space-y-2">
        <Label>Meal Timing</Label>
        <ToggleGroup
          options={["good", "irregular", "poor"]}
          value={formState.mealTiming}
          onChange={(mealTiming) => updateFormState({ mealTiming })}
        />
      </div>

      <div className="space-y-2">
        <Label>Protein Adequacy</Label>
        <ToggleGroup
          options={["high", "medium", "low"]}
          value={formState.proteinAdequacy}
          onChange={(proteinAdequacy) => updateFormState({ proteinAdequacy })}
        />
      </div>

      <div className="space-y-2">
        <Label>Junk Food Today</Label>
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((value) => (
            <button
              className={`rounded-md border px-3 py-3 text-sm ${
                formState.junkFoodToday === value
                  ? "border-[#6366f1] bg-[#6366f1] text-white"
                  : "border-[#2a2a2a] bg-[#111111] text-[#9ca3af]"
              }`}
              key={String(value)}
              type="button"
              onClick={() => updateFormState({ junkFoodToday: value })}
            >
              {value ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      <SliderField
        label="How stable was your energy throughout the day?"
        max={10}
        min={0}
        value={formState.energyStability}
        onChange={(energyStability) => updateFormState({ energyStability })}
      />

      <div className="space-y-2">
        <Label htmlFor="nutritionNotes">Notes</Label>
        <textarea
          className="min-h-24 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f9fafb] outline-none"
          id="nutritionNotes"
          value={formState.notes}
          onChange={(event) => updateFormState({ notes: event.target.value })}
        />
      </div>

      {successMessage ? (
        <p className="text-sm text-[#10b981]">{successMessage}</p>
      ) : null}
      <Button
        className="h-12 w-full bg-[#6366f1] text-base text-white hover:bg-[#5558df]"
        size="lg"
        type="button"
        onClick={submitNutrition}
      >
        Save Nutrition Log
      </Button>
    </section>
  );
}
