"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type { LifestyleLog } from "@/types/models";

type LifestyleLogWithTimestamps = LifestyleLog & {
  createdAt: string;
  updatedAt: string;
};

type LifestyleFormState = {
  mood: number;
  motivation: number;
  focus: number;
  productivity: number;
  energy: number;
  stress: number;
  notes: string;
};

const DEFAULT_FORM_STATE: LifestyleFormState = {
  mood: 5,
  motivation: 5,
  focus: 5,
  productivity: 5,
  energy: 5,
  stress: 5,
  notes: "",
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function SliderField({
  label,
  value,
  showMoodEmoji,
  onChange,
}: {
  label: string;
  value: number;
  showMoodEmoji?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-[#f9fafb]">{label}</Label>
        <span className="rounded bg-[#111111] px-2 py-1 text-sm text-[#f9fafb]">
          {value}
        </span>
      </div>
      {showMoodEmoji ? (
        <div className="flex justify-between text-lg" aria-hidden="true">
          <span>😔</span>
          <span>😐</span>
          <span>😊</span>
        </div>
      ) : null}
      <input
        className="w-full accent-[#6366f1]"
        max={10}
        min={0}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function LifestyleForm() {
  const { user } = useUserStore();
  const today = getTodayDate();
  const [existingLog, setExistingLog] = useState<LifestyleLog | null>(null);
  const [formState, setFormState] =
    useState<LifestyleFormState>(DEFAULT_FORM_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void db.lifestyleLogs
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
            mood: log.mood,
            motivation: log.motivation,
            focus: log.focus,
            productivity: log.productivity,
            energy: log.energy,
            stress: log.stress,
            notes: log.notes,
          });
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [today]);

  const updateFormState = (updates: Partial<LifestyleFormState>) => {
    setFormState((currentState) => ({ ...currentState, ...updates }));
  };

  const submitLifestyle = async () => {
    const now = new Date().toISOString();
    const log: LifestyleLogWithTimestamps = {
      id: existingLog?.id ?? crypto.randomUUID(),
      userId: existingLog?.userId ?? user?.id ?? "guest",
      date: today,
      mood: formState.mood,
      motivation: formState.motivation,
      focus: formState.focus,
      productivity: formState.productivity,
      energy: formState.energy,
      stress: formState.stress,
      notes: formState.notes,
      createdAt: now,
      updatedAt: now,
    };

    if (existingLog) {
      await db.lifestyleLogs.put(log);
      await addToSyncQueue("lifestyle_logs", "update", { ...log });
    } else {
      await db.lifestyleLogs.add(log);
      await addToSyncQueue("lifestyle_logs", "insert", { ...log });
    }

    setExistingLog(log);
    setSuccessMessage("Lifestyle logged! ✓");
    window.setTimeout(() => setSuccessMessage(null), 1800);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading lifestyle log...
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <header>
        <p className="text-sm text-[#9ca3af]">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold text-[#f9fafb]">
          {existingLog ? "Edit Today's Log" : "How are you feeling today?"}
        </h1>
      </header>

      <SliderField
        label="Overall mood"
        showMoodEmoji
        value={formState.mood}
        onChange={(mood) => updateFormState({ mood })}
      />
      <SliderField
        label="Motivation level"
        value={formState.motivation}
        onChange={(motivation) => updateFormState({ motivation })}
      />
      <SliderField
        label="Mental focus"
        value={formState.focus}
        onChange={(focus) => updateFormState({ focus })}
      />
      <SliderField
        label="Productivity"
        value={formState.productivity}
        onChange={(productivity) => updateFormState({ productivity })}
      />
      <SliderField
        label="Energy level"
        value={formState.energy}
        onChange={(energy) => updateFormState({ energy })}
      />
      <SliderField
        label="Stress level"
        value={formState.stress}
        onChange={(stress) => updateFormState({ stress })}
      />

      <div className="space-y-2">
        <Label htmlFor="lifestyleNotes">Notes</Label>
        <textarea
          className="min-h-24 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f9fafb] outline-none"
          id="lifestyleNotes"
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
        onClick={submitLifestyle}
      >
        Save Lifestyle Log
      </Button>
    </section>
  );
}
