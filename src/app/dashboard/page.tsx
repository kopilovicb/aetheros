"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { ScoreRing } from "@/components/cards/ScoreRing";
import { Sparkline } from "@/components/charts/Sparkline";
import { QuickLogWidget } from "@/components/dashboard/QuickLogWidget";
import { AIStatus } from "@/components/layout/AIStatus";
import { SyncIndicator } from "@/components/layout/SyncIndicator";
import { CardSkeleton, ScoreRingSkeleton } from "@/components/ui/Skeleton";
import { aetherAI } from "@/lib/ai/transformers";
import { db } from "@/lib/db/schema";
import { generateInsights, type Insight } from "@/lib/engines/insights";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { SupplementEntry, SupplementLog } from "@/types/models";

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getRecommendation(recoveryScore: number | null): string {
  if (recoveryScore === null) {
    return "Log today's check-in to get your recommendation.";
  }

  if (recoveryScore >= 67) {
    return "🟢 Train — Recovery looks strong. Good day for a quality session.";
  }

  if (recoveryScore >= 34) {
    return "🟡 Train light — Some fatigue present. Keep intensity moderate.";
  }

  return "🔴 Recover — Multiple markers are low. Prioritize rest today.";
}

function getInsightBorder(severity: "info" | "warning" | "alert"): string {
  if (severity === "alert") {
    return "border-l-[#ef4444]";
  }

  if (severity === "warning") {
    return "border-l-[#f59e0b]";
  }

  return "border-l-[#10b981]";
}

function TrendSparklinesSection({
  energyData,
  hrvData,
  sleepData,
}: {
  energyData: number[];
  hrvData: number[];
  sleepData: number[];
}) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <Sparkline currentValue={hrvData.at(-1) ?? 0} data={hrvData} label="HRV" />
      <Sparkline
        currentValue={sleepData.at(-1) ?? 0}
        data={sleepData}
        label="Sleep"
      />
      <Sparkline
        currentValue={energyData.at(-1) ?? 0}
        data={energyData}
        label="Energy"
      />
    </section>
  );
}

function SupplementChecklistWidget({
  supplementLog,
  onToggleSupplement,
}: {
  supplementLog: SupplementLog | null;
  onToggleSupplement: (index: number) => void;
}) {
  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-lg font-semibold">Today&apos;s Supplements</h2>
      {supplementLog?.supplements.length ? (
        <div className="mt-4 space-y-3">
          {supplementLog.supplements.map((supplement, index) => (
            <label
              className="flex min-h-11 items-center justify-between rounded-md bg-[#111111] px-3 py-3 text-sm"
              key={`${supplement.name}-${index}`}
            >
              <span>
                <span className="font-medium text-[#f9fafb]">
                  {supplement.name}
                </span>
                {supplement.purpose ? (
                  <span className="ml-2 text-[#9ca3af]">
                    {supplement.purpose}
                  </span>
                ) : null}
              </span>
              <input
                checked={supplement.taken}
                className="h-5 w-5 accent-[#10b981]"
                type="checkbox"
                onChange={() => onToggleSupplement(index)}
              />
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[#9ca3af]">
          Set up your supplements in Settings
        </p>
      )}
    </section>
  );
}

const DynamicTrendSparklinesSection = dynamic(
  () => Promise.resolve(TrendSparklinesSection),
  {
    ssr: false,
    loading: () => <CardSkeleton />,
  },
);

const DynamicSupplementChecklistWidget = dynamic(
  () => Promise.resolve(SupplementChecklistWidget),
  {
    ssr: false,
    loading: () => <CardSkeleton />,
  },
);

export default function DashboardPage() {
  const {
    dailyScores,
    isLoading,
    recentLogs,
    refresh,
    streak,
    todaysLog,
    todaysSupplementLog,
    userProfile,
  } = useDashboardData();
  const [todaysInsight, setTodaysInsight] = useState<Insight | null>(null);
  const hrvData = useMemo(() => recentLogs.map((log) => log.hrv), [recentLogs]);
  const sleepData = useMemo(
    () => recentLogs.map((log) => log.sleepScore),
    [recentLogs],
  );
  const energyData = useMemo(
    () => recentLogs.map((log) => log.energyLevel),
    [recentLogs],
  );

  useEffect(() => {
    aetherAI.initialize();
  }, []);

  useEffect(() => {
    const userId = userProfile?.id ?? todaysLog?.userId;

    if (!userId) {
      return;
    }

    let isMounted = true;

    void generateInsights(userId).then((insights) => {
      if (isMounted) {
        setTodaysInsight(insights[0] ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [todaysLog?.userId, userProfile?.id]);

  const topRule = dailyScores?.triggeredRules[0] ?? null;
  const insightMessage = todaysLog
    ? todaysInsight?.message ??
      topRule?.message ??
      "Recovery markers are ready for review."
    : "Complete your first check-in to unlock insights.";
  const insightSeverity = todaysInsight?.severity ?? topRule?.severity ?? "info";
  const recoveryScore = dailyScores?.recoveryScore ?? 0;
  const fatigueScore = dailyScores?.fatigueScore ?? 0;
  const sleepScore = todaysLog?.sleepScore ?? 0;

  const toggleSupplement = async (index: number) => {
    if (!todaysSupplementLog) {
      return;
    }

    const updatedSupplements: SupplementEntry[] =
      todaysSupplementLog.supplements.map((supplement, supplementIndex) =>
        supplementIndex === index
          ? { ...supplement, taken: !supplement.taken }
          : supplement,
      );
    const updatedLog = {
      ...todaysSupplementLog,
      supplements: updatedSupplements,
    };

    await db.supplementLogs.put(updatedLog);
    await addToSyncQueue("supplement_logs", "update", { ...updatedLog });
    await refresh();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-[#f9fafb]">
        <div className="mx-auto w-full max-w-[600px] space-y-5">
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
            <ScoreRingSkeleton />
            <ScoreRingSkeleton />
            <ScoreRingSkeleton />
          </div>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-[600px] space-y-5">
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">
                Good morning, {userProfile?.name ?? "there"}
              </h1>
              <p className="mt-1 text-sm text-[#9ca3af]">{formatToday()}</p>
            </div>
            <div className="relative flex min-w-24 flex-col items-end gap-1">
              <AIStatus />
              <SyncIndicator />
            </div>
          </div>
        </header>

        <QuickLogWidget />

        <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <div className="grid grid-cols-3 items-center gap-2">
            <ScoreRing label="Fatigue Score" score={fatigueScore} size="sm" />
            <ScoreRing
              label="Recovery Readiness"
              score={recoveryScore}
              size="lg"
            />
            <ScoreRing label="Sleep Score" score={sleepScore} size="sm" />
          </div>
          {!todaysLog ? (
            <p className="mt-4 text-center text-sm text-[#9ca3af]">
              Log data to see scores
            </p>
          ) : null}
        </section>

        <section
          className={`rounded-lg border border-[#2a2a2a] border-l-4 bg-[#1a1a1a] p-5 ${getInsightBorder(
            insightSeverity,
          )}`}
        >
          <h2 className="text-lg font-semibold">Today&apos;s Insight</h2>
          <p className="mt-2 text-sm leading-6 text-[#9ca3af]">
            {insightMessage}
          </p>
        </section>

        <DynamicTrendSparklinesSection
          energyData={energyData}
          hrvData={hrvData}
          sleepData={sleepData}
        />

        <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-lg font-semibold">Today&apos;s Recommendation</h2>
          <p className="mt-2 text-sm leading-6 text-[#9ca3af]">
            {getRecommendation(todaysLog ? recoveryScore : null)}
          </p>
        </section>

        <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          {streak > 0 ? (
            <div>
              <p className="text-4xl font-semibold">{streak}</p>
              <p className="mt-1 text-sm text-[#9ca3af]">day streak 🔥</p>
            </div>
          ) : (
            <p className="text-sm text-[#9ca3af]">Start your streak today!</p>
          )}
        </section>

        <DynamicSupplementChecklistWidget
          supplementLog={todaysSupplementLog ?? null}
          onToggleSupplement={(index) => void toggleSupplement(index)}
        />
      </div>
    </main>
  );
}
