"use client";

import { CorrelationMatrix } from "@/components/cards/CorrelationMatrix";
import { LongTermCharts } from "@/components/cards/LongTermCharts";
import { PersonalRecords } from "@/components/cards/PersonalRecords";
import { ConsistencyHeatmap } from "@/components/charts/ConsistencyHeatmap";
import { TrainingRecoveryOverlay } from "@/components/charts/TrainingRecoveryOverlay";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { useTrendsData } from "@/hooks/useTrendsData";

export default function TrendsPage() {
  const { isLoading } = useTrendsData();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <header>
          <h1 className="text-3xl font-semibold">Trends &amp; Correlations</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Long-term patterns across recovery, sleep, training, and behavior.
          </p>
        </header>
        <CorrelationMatrix />
        <LongTermCharts />
        <ConsistencyHeatmap />
        <TrainingRecoveryOverlay />
        <PersonalRecords />
      </div>
    </main>
  );
}
