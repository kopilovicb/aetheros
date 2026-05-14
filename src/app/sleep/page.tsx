"use client";

import { useEffect, useMemo, useState } from "react";

import { SleepDetail } from "@/components/cards/SleepDetail";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type { RecoveryLog } from "@/types/models";

type SleepFormState = {
  sleepScore: number;
  sleepDuration: number;
  notes: string;
};

const DEFAULT_SLEEP_FORM: SleepFormState = {
  sleepScore: 70,
  sleepDuration: 7.5,
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

function ViewToggle({
  activeView,
  onChange,
}: {
  activeView: "log" | "analysis";
  onChange: (view: "log" | "analysis") => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1">
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "log"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("log")}
      >
        Log
      </button>
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "analysis"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("analysis")}
      >
        Analysis
      </button>
    </div>
  );
}

export default function SleepPage() {
  const { user } = useUserStore();
  const today = useMemo(() => getTodayDate(), []);
  const [activeView, setActiveView] = useState<"log" | "analysis">("log");
  const [todaysLog, setTodaysLog] = useState<RecoveryLog | null>(null);
  const [formState, setFormState] =
    useState<SleepFormState>(DEFAULT_SLEEP_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void db.recoveryLogs
      .where("date")
      .equals(today)
      .first()
      .then((log) => {
        if (!isMounted) {
          return;
        }

        if (log) {
          setTodaysLog(log);
          setFormState({
            sleepScore: log.sleepScore,
            sleepDuration: log.sleepDuration,
            notes: log.notes,
          });
          setActiveView("analysis");
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [today]);

  const updateFormState = (updates: Partial<SleepFormState>) => {
    setFormState((currentState) => ({ ...currentState, ...updates }));
  };

  const saveSleepLog = async () => {
    const now = new Date().toISOString();
    const log: RecoveryLog = todaysLog
      ? {
          ...todaysLog,
          sleepScore: formState.sleepScore,
          sleepDuration: formState.sleepDuration,
          notes: formState.notes,
          updatedAt: now,
        }
      : {
          id: crypto.randomUUID(),
          userId: user?.id ?? "guest",
          date: today,
          sleepScore: formState.sleepScore,
          sleepDuration: formState.sleepDuration,
          hrv: 0,
          bodyBattery: 0,
          stressLevel: 0,
          soreness: 0,
          energyLevel: 0,
          notes: formState.notes,
          createdAt: now,
          updatedAt: now,
        };

    await db.recoveryLogs.put(log);
    await addToSyncQueue("recovery_logs", todaysLog ? "update" : "insert", {
      ...log,
    });

    setTodaysLog(log);
    setIsEditing(false);
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 1800);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-[#f9fafb]">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-sm text-[#9ca3af]">
          Loading sleep log...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <ViewToggle activeView={activeView} onChange={setActiveView} />

        {activeView === "analysis" ? (
          <SleepDetail />
        ) : (
          <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            <header className="mb-6">
              <p className="text-sm text-[#9ca3af]">{today}</p>
              <h1 className="mt-1 text-3xl font-semibold">Sleep Log</h1>
            </header>

            {todaysLog && !isEditing ? (
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-[#111111] p-4">
                    <p className="text-sm text-[#9ca3af]">Sleep Score</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {todaysLog.sleepScore}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#111111] p-4">
                    <p className="text-sm text-[#9ca3af]">Sleep Duration</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {todaysLog.sleepDuration}h
                    </p>
                  </div>
                </div>
                {todaysLog.notes ? (
                  <p className="mt-4 rounded-md bg-[#111111] p-4 text-sm leading-6 text-[#9ca3af]">
                    {todaysLog.notes}
                  </p>
                ) : null}
                <Button
                  className="mt-6 w-full bg-[#6366f1] text-white hover:bg-[#5558df]"
                  size="lg"
                  type="button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <SliderField
                  label="Sleep Score"
                  max={100}
                  min={0}
                  value={formState.sleepScore}
                  onChange={(sleepScore) => updateFormState({ sleepScore })}
                />
                <SliderField
                  label="Sleep Duration"
                  max={12}
                  min={4}
                  step={0.5}
                  value={formState.sleepDuration}
                  valueLabel={`${formState.sleepDuration}h`}
                  onChange={(sleepDuration) =>
                    updateFormState({ sleepDuration })
                  }
                />
                <div className="space-y-2">
                  <Label className="text-[#f9fafb]" htmlFor="sleepNotes">
                    Notes
                  </Label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f9fafb] outline-none"
                    id="sleepNotes"
                    value={formState.notes}
                    onChange={(event) =>
                      updateFormState({ notes: event.target.value })
                    }
                  />
                </div>
                {isSaved ? (
                  <p className="text-sm text-[#10b981]">Sleep log saved.</p>
                ) : null}
                <Button
                  className="h-12 w-full bg-[#6366f1] text-base text-white hover:bg-[#5558df]"
                  size="lg"
                  type="button"
                  onClick={saveSleepLog}
                >
                  Save Sleep Log
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
