"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { RecoveryDetail } from "@/components/cards/RecoveryDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type { RecoveryLog } from "@/types/models";

type RecoveryFormState = {
  sleepScore: number;
  sleepDuration: number;
  hrv: string;
  energyLevel: number;
  soreness: number;
  stressLevel: number;
  bodyBattery: number;
  notes: string;
};

const DEFAULT_FORM_STATE: RecoveryFormState = {
  sleepScore: 70,
  sleepDuration: 7.5,
  hrv: "60",
  energyLevel: 5,
  soreness: 0,
  stressLevel: 5,
  bodyBattery: 50,
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

export default function RecoveryPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const today = useMemo(() => getTodayDate(), []);
  const [formState, setFormState] =
    useState<RecoveryFormState>(DEFAULT_FORM_STATE);
  const [existingLog, setExistingLog] = useState<RecoveryLog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeView, setActiveView] = useState<"log" | "analysis">("log");

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
          setExistingLog(log);
          setFormState({
            sleepScore: log.sleepScore,
            sleepDuration: log.sleepDuration,
            hrv: String(log.hrv),
            energyLevel: log.energyLevel,
            soreness: log.soreness,
            stressLevel: log.stressLevel,
            bodyBattery: log.bodyBattery,
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

  const requiredCompleted = formState.hrv.trim() ? 4 : 3;

  const updateFormState = (updates: Partial<RecoveryFormState>) => {
    setFormState((currentState) => ({ ...currentState, ...updates }));
  };

  const submitLog = async () => {
    const hrv = Number(formState.hrv);

    if (!formState.hrv.trim() || Number.isNaN(hrv)) {
      setErrorMessage("Morning HRV is required.");
      return;
    }

    setErrorMessage(null);

    const now = new Date().toISOString();
    const log: RecoveryLog = {
      id: existingLog?.id ?? crypto.randomUUID(),
      userId: user?.id ?? "guest",
      date: today,
      sleepScore: formState.sleepScore,
      sleepDuration: formState.sleepDuration,
      hrv,
      bodyBattery: formState.bodyBattery,
      stressLevel: formState.stressLevel,
      soreness: formState.soreness,
      energyLevel: formState.energyLevel,
      notes: formState.notes,
      createdAt: existingLog?.createdAt ?? now,
      updatedAt: now,
    };

    if (existingLog) {
      await db.recoveryLogs.put(log);
      await addToSyncQueue("recovery_logs", "update", { ...log });
    } else {
      await db.recoveryLogs.add(log);
      await addToSyncQueue("recovery_logs", "insert", { ...log });
    }

    setExistingLog(log);
    setIsEditing(false);
    setIsSuccess(true);

    window.setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <ChartSkeleton />
          <ChartSkeleton />
          <CardSkeleton />
        </div>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-[#f9fafb]">
        <div className="w-full max-w-md rounded-lg border border-[#10b981]/40 bg-[#1a1a1a] p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#10b981] text-2xl font-bold text-[#0a0a0a]">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Logged! Great work.</h1>
        </div>
      </main>
    );
  }

  if (activeView === "analysis") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <ViewToggle activeView={activeView} onChange={setActiveView} />
          <RecoveryDetail />
        </div>
      </main>
    );
  }

  if (existingLog && !isEditing) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <ViewToggle activeView={activeView} onChange={setActiveView} />

          <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6">
            <h1 className="text-2xl font-semibold">Already logged today</h1>
            <p className="mt-2 text-sm text-[#9ca3af]">{today}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-[#111111] p-4">
                <p className="text-sm text-[#9ca3af]">Sleep Score</p>
                <p className="mt-1 text-2xl font-semibold">
                  {existingLog.sleepScore}
                </p>
              </div>
              <div className="rounded-md bg-[#111111] p-4">
                <p className="text-sm text-[#9ca3af]">Sleep Duration</p>
                <p className="mt-1 text-2xl font-semibold">
                  {existingLog.sleepDuration}h
                </p>
              </div>
              <div className="rounded-md bg-[#111111] p-4">
                <p className="text-sm text-[#9ca3af]">HRV</p>
                <p className="mt-1 text-2xl font-semibold">{existingLog.hrv}</p>
              </div>
              <div className="rounded-md bg-[#111111] p-4">
                <p className="text-sm text-[#9ca3af]">Energy</p>
                <p className="mt-1 text-2xl font-semibold">
                  {existingLog.energyLevel}/10
                </p>
              </div>
            </div>

            <Button
              className="mt-6 w-full bg-[#6366f1] text-white hover:bg-[#5558df]"
              size="lg"
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <ViewToggle activeView={activeView} onChange={setActiveView} />

        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          <header className="mb-6">
            <p className="text-sm text-[#9ca3af]">{today}</p>
            <h1 className="mt-1 text-3xl font-semibold">Morning Check-in</h1>
          </header>

          <div className="mb-6 rounded-md bg-[#111111] p-3 text-sm text-[#9ca3af]">
            Required fields: {requiredCompleted}/4 · Optional fields:{" "}
            {showOptionalFields ? "visible" : "hidden"}
          </div>

          <div className="space-y-6">
            <SliderField
              label="How was your sleep quality?"
              max={100}
              min={0}
              value={formState.sleepScore}
              onChange={(sleepScore) => updateFormState({ sleepScore })}
            />
            <SliderField
              label="How long did you sleep?"
              max={12}
              min={4}
              step={0.5}
              value={formState.sleepDuration}
              valueLabel={`${formState.sleepDuration}h`}
              onChange={(sleepDuration) => updateFormState({ sleepDuration })}
            />

            <div className="space-y-2">
              <Label className="text-[#f9fafb]" htmlFor="hrv">
                Morning HRV (from your device)
              </Label>
              <Input
                id="hrv"
                max="200"
                min="20"
                type="number"
                value={formState.hrv}
                onChange={(event) =>
                  updateFormState({ hrv: event.target.value })
                }
              />
            </div>

            <SliderField
              label="Energy level this morning"
              max={10}
              min={0}
              value={formState.energyLevel}
              onChange={(energyLevel) => updateFormState({ energyLevel })}
            />

            <button
              className="text-sm font-medium text-[#6366f1]"
              type="button"
              onClick={() => setShowOptionalFields((isShown) => !isShown)}
            >
              {showOptionalFields ? "Hide details" : "Add more detail"}
            </button>

            {showOptionalFields ? (
              <div className="space-y-6 border-t border-[#2a2a2a] pt-6">
                <SliderField
                  label="Overall muscle soreness"
                  max={10}
                  min={0}
                  value={formState.soreness}
                  onChange={(soreness) => updateFormState({ soreness })}
                />
                <SliderField
                  label="Stress level"
                  max={10}
                  min={0}
                  value={formState.stressLevel}
                  onChange={(stressLevel) => updateFormState({ stressLevel })}
                />
                <SliderField
                  label="Body battery (Garmin/Whoop)"
                  max={100}
                  min={0}
                  value={formState.bodyBattery}
                  onChange={(bodyBattery) => updateFormState({ bodyBattery })}
                />
                <div className="space-y-2">
                  <Label className="text-[#f9fafb]" htmlFor="notes">
                    Any notes?
                  </Label>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f9fafb] outline-none"
                    id="notes"
                    value={formState.notes}
                    onChange={(event) =>
                      updateFormState({ notes: event.target.value })
                    }
                  />
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="text-sm text-red-400">{errorMessage}</p>
            ) : null}

            <Button
              className="h-12 w-full bg-[#6366f1] text-base text-white hover:bg-[#5558df]"
              size="lg"
              type="button"
              onClick={submitLog}
            >
              Log Today
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
