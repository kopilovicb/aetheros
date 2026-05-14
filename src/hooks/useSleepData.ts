"use client";

import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { calculatePearson } from "@/lib/engines/correlation";
import { calculateDailyScores } from "@/lib/engines/scoring";
import type { RecoveryLog, UserBaseline } from "@/types/models";

export type SleepCorrelation = {
  metricA: string;
  metricB: string;
  coefficient: number;
  dataPoints: number;
  insight: string;
};

type BestNight = {
  date: string;
  sleepScore: number;
} | null;

type SleepData = {
  logs: RecoveryLog[];
  avgSleepScore: number;
  avgDuration: number;
  bestNight: BestNight;
  consistencyScore: number;
  correlations: SleepCorrelation[];
  baseline: UserBaseline | null;
  isLoading: boolean;
};

type LoadedSleepData = Omit<SleepData, "isLoading">;

const MIN_CORRELATION_POINTS = 14;

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function createCorrelationInsight(
  metricA: string,
  metricB: string,
  coefficient: number,
): string {
  if (metricA === "stressLevel") {
    return coefficient < 0
      ? `Higher stress levels appear to correlate with lower sleep scores (r=${coefficient.toFixed(2)})`
      : `Higher stress levels appear to correlate with higher sleep scores (r=${coefficient.toFixed(2)})`;
  }

  return coefficient < 0
    ? `Higher caffeine intake appears to correlate with shorter sleep duration (r=${coefficient.toFixed(2)})`
    : `Higher caffeine intake appears to correlate with longer sleep duration (r=${coefficient.toFixed(2)})`;
}

function buildCorrelation(
  metricA: string,
  metricB: string,
  xValues: number[],
  yValues: number[],
): SleepCorrelation | null {
  if (xValues.length < MIN_CORRELATION_POINTS) {
    return null;
  }

  const coefficient = calculatePearson(xValues, yValues);

  if (Math.abs(coefficient) <= 0.3) {
    return null;
  }

  return {
    metricA,
    metricB,
    coefficient,
    dataPoints: xValues.length,
    insight: createCorrelationInsight(metricA, metricB, coefficient),
  };
}

async function loadSleepData(): Promise<LoadedSleepData> {
  const windowStart = getWindowStartDate(30);
  const [logs, nutritionLogs, baselines, workouts] = await Promise.all([
    db.recoveryLogs.where("date").aboveOrEqual(windowStart).sortBy("date"),
    db.nutritionLogs.where("date").aboveOrEqual(windowStart).sortBy("date"),
    db.userBaselines.toArray(),
    db.workoutLogs.orderBy("date").toArray(),
  ]);
  const baseline = baselines[0] ?? null;
  const sleepScores = logs.map((log) => log.sleepScore);
  const sleepDurations = logs.map((log) => log.sleepDuration);
  const bestNight = logs.reduce<BestNight>((best, log) => {
    if (!best || log.sleepScore > best.sleepScore) {
      return { date: log.date, sleepScore: log.sleepScore };
    }

    return best;
  }, null);
  const todaysLog = logs.at(-1) ?? null;
  const consistencyScore =
    todaysLog && baseline
      ? calculateDailyScores(todaysLog, baseline, logs, workouts)
          .sleepConsistencyScore
      : 0;
  const stressCorrelation = buildCorrelation(
    "stressLevel",
    "sleepScore",
    logs.map((log) => log.stressLevel),
    logs.map((log) => log.sleepScore),
  );
  const recoveryByDate = new Map(logs.map((log) => [log.date, log]));
  const caffeineValues: number[] = [];
  const sleepDurationValues: number[] = [];

  for (const nutritionLog of nutritionLogs) {
    const recoveryLog = recoveryByDate.get(nutritionLog.date);

    if (recoveryLog) {
      caffeineValues.push(nutritionLog.caffeineIntake);
      sleepDurationValues.push(recoveryLog.sleepDuration);
    }
  }

  const caffeineCorrelation = buildCorrelation(
    "caffeineIntake",
    "sleepDuration",
    caffeineValues,
    sleepDurationValues,
  );

  return {
    logs,
    avgSleepScore: average(sleepScores),
    avgDuration: average(sleepDurations),
    bestNight,
    consistencyScore,
    correlations: [stressCorrelation, caffeineCorrelation].filter(
      (correlation): correlation is SleepCorrelation => correlation !== null,
    ),
    baseline,
  };
}

export function useSleepData(): SleepData {
  const [data, setData] = useState<LoadedSleepData>({
    logs: [],
    avgSleepScore: 0,
    avgDuration: 0,
    bestNight: null,
    consistencyScore: 0,
    correlations: [],
    baseline: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loadedData = await loadSleepData();
    setData(loadedData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadSleepData().then((loadedData) => {
      if (!isMounted) {
        return;
      }

      setData(loadedData);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  void refresh;

  return {
    ...data,
    bestNight: data.bestNight
      ? {
          ...data.bestNight,
          date: formatDate(data.bestNight.date),
        }
      : null,
    isLoading,
  };
}
