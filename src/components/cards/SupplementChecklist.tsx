"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type { SupplementEntry, SupplementLog } from "@/types/models";

const SUPPLEMENT_LIBRARY_KEY = "aetheros_supplement_library";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function readLibrary(): SupplementEntry[] {
  const rawLibrary = localStorage.getItem(SUPPLEMENT_LIBRARY_KEY);

  if (!rawLibrary) {
    return [];
  }

  try {
    const parsedLibrary: unknown = JSON.parse(rawLibrary);
    return Array.isArray(parsedLibrary)
      ? parsedLibrary.filter(
          (item): item is SupplementEntry =>
            typeof item === "object" &&
            item !== null &&
            "name" in item &&
            typeof item.name === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function getPurposeClass(purpose: string): string {
  const normalizedPurpose = purpose.toLowerCase();

  if (normalizedPurpose === "sleep") {
    return "bg-[#6366f1]/15 text-[#6366f1]";
  }

  if (normalizedPurpose === "recovery") {
    return "bg-[#10b981]/15 text-[#10b981]";
  }

  if (normalizedPurpose === "performance") {
    return "bg-[#f59e0b]/15 text-[#f59e0b]";
  }

  return "bg-[#9ca3af]/15 text-[#9ca3af]";
}

function getAdherenceColor(percentage: number): string {
  if (percentage >= 80) {
    return "#10b981";
  }

  if (percentage >= 50) {
    return "#f59e0b";
  }

  return "#ef4444";
}

export function SupplementChecklist() {
  const { user } = useUserStore();
  const [todaysLog, setTodaysLog] = useState<SupplementLog | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<SupplementLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = getTodayDate();

  useEffect(() => {
    let isMounted = true;

    const loadChecklist = async () => {
      const library = readLibrary();
      const existingLog = await db.supplementLogs
        .where("date")
        .equals(today)
        .first();
      let log = existingLog ?? null;

      if (!log && library.length > 0) {
        log = {
          id: crypto.randomUUID(),
          userId: user?.id ?? "guest",
          date: today,
          supplements: library.map((supplement) => ({
            ...supplement,
            taken: false,
          })),
        };
        await db.supplementLogs.add(log);
        await addToSyncQueue("supplement_logs", "insert", { ...log });
      }

      const weekStart = getWindowStartDate(7);
      const logs = await db.supplementLogs
        .where("date")
        .aboveOrEqual(weekStart)
        .sortBy("date");

      if (!isMounted) {
        return;
      }

      setTodaysLog(log);
      setWeeklyLogs(logs);
      setIsLoading(false);
    };

    void loadChecklist();

    return () => {
      isMounted = false;
    };
  }, [today, user?.id]);

  const toggleSupplement = async (index: number) => {
    if (!todaysLog) {
      return;
    }

    const updatedLog: SupplementLog = {
      ...todaysLog,
      supplements: todaysLog.supplements.map((supplement, supplementIndex) =>
        supplementIndex === index
          ? { ...supplement, taken: !supplement.taken }
          : supplement,
      ),
    };

    await db.supplementLogs.put(updatedLog);
    await addToSyncQueue("supplement_logs", "update", { ...updatedLog });
    setTodaysLog(updatedLog);

    const weekStart = getWindowStartDate(7);
    setWeeklyLogs(
      await db.supplementLogs
        .where("date")
        .aboveOrEqual(weekStart)
        .sortBy("date"),
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading supplements...
      </div>
    );
  }

  if (!todaysLog || todaysLog.supplements.length === 0) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        No supplements in your library yet.
      </div>
    );
  }

  const takenCount = todaysLog.supplements.filter(
    (supplement) => supplement.taken,
  ).length;
  const totalCount = todaysLog.supplements.length;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-[#f9fafb]">
            Today&apos;s Supplements
          </h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            {takenCount} of {totalCount} taken today
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#111111]">
            <div
              className="h-full rounded-full bg-[#10b981]"
              style={{ width: `${(takenCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {todaysLog.supplements.map((supplement, index) => (
            <label
              className="flex items-center gap-3 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
              key={`${supplement.name}-${index}`}
            >
              <input
                checked={supplement.taken}
                className="h-6 w-6 accent-[#10b981]"
                type="checkbox"
                onChange={() => void toggleSupplement(index)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[#f9fafb]">
                  {supplement.name}
                </span>
                <span className="mt-1 block text-sm text-[#9ca3af]">
                  {supplement.dosage} — {supplement.timing}
                </span>
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs ${getPurposeClass(
                  supplement.purpose,
                )}`}
              >
                {supplement.purpose}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          This Week&apos;s Adherence
        </h2>
        <div className="mt-4 space-y-4">
          {todaysLog.supplements.map((supplement) => {
            const entries = weeklyLogs.flatMap((log) =>
              log.supplements.filter((entry) => entry.name === supplement.name),
            );
            const percentage =
              entries.length > 0
                ? Math.round(
                    (entries.filter((entry) => entry.taken).length /
                      entries.length) *
                      100,
                  )
                : 0;

            return (
              <div key={supplement.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[#f9fafb]">{supplement.name}</span>
                  <span className="text-[#9ca3af]">{percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#111111]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: getAdherenceColor(percentage),
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
