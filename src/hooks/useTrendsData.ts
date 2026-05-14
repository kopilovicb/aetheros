"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { calculateCorrelations, type CorrelationResult } from "@/lib/engines/correlation";
import { analyzeTrends, type TrendResult } from "@/lib/engines/trends";
import type { NutritionLog, RecoveryLog, WorkoutLog } from "@/types/models";

export type HeatmapDay = {
  date: string;
  recoveryLogged: boolean;
  workoutLogged: boolean;
  nutritionLogged: boolean;
};

export type TrainingRecoveryPoint = {
  date: string;
  fatigue: number;
  recoveryScore: number;
};

export type PersonalRecord = {
  metric: string;
  value: string;
  date: string;
};

type TrendsData = {
  correlations: CorrelationResult[];
  longTermData: RecoveryLog[];
  heatmapData: HeatmapDay[];
  personalRecords: PersonalRecord[];
  trainingRecoveryData: TrainingRecoveryPoint[];
  trends: TrendResult[];
  isLoading: boolean;
};

type LoadedTrendsData = Omit<TrendsData, "isLoading">;

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function recoveryScore(log: RecoveryLog): number {
  return Math.round(
    Math.max(
      0,
      Math.min(100, (log.sleepScore + log.bodyBattery + (10 - log.stressLevel) * 10) / 3),
    ),
  );
}

function calculateLongestStreak(logs: RecoveryLog[]): number {
  const dates = [...new Set(logs.map((log) => log.date))].sort();
  let longest = 0;
  let current = 0;
  let previousTime = 0;

  for (const date of dates) {
    const time = new Date(`${date}T00:00:00`).getTime();
    current = previousTime && time - previousTime === 86_400_000 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousTime = time;
  }

  return longest;
}

function maxBy<TItem>(
  items: TItem[],
  valueGetter: (item: TItem) => number,
): TItem | null {
  return items.reduce<TItem | null>((best, item) => {
    if (!best || valueGetter(item) > valueGetter(best)) {
      return item;
    }

    return best;
  }, null);
}

function buildPersonalRecords(
  recoveryLogs: RecoveryLog[],
  workoutLogs: WorkoutLog[],
): PersonalRecord[] {
  const bestRecovery = maxBy(recoveryLogs, recoveryScore);
  const bestSleep = maxBy(recoveryLogs, (log) => log.sleepScore);
  const bestHrv = maxBy(recoveryLogs, (log) => log.hrv);
  const bestWorkout = maxBy(workoutLogs, (log) => log.workoutQuality);

  return [
    bestRecovery
      ? {
          metric: "Best Recovery Score",
          value: String(recoveryScore(bestRecovery)),
          date: formatDate(bestRecovery.date),
        }
      : null,
    bestSleep
      ? {
          metric: "Best Sleep Score",
          value: String(bestSleep.sleepScore),
          date: formatDate(bestSleep.date),
        }
      : null,
    bestHrv
      ? {
          metric: "Best HRV",
          value: String(bestHrv.hrv),
          date: formatDate(bestHrv.date),
        }
      : null,
    {
      metric: "Longest Logging Streak",
      value: `${calculateLongestStreak(recoveryLogs)} days`,
      date: "All time",
    },
    bestWorkout
      ? {
          metric: "Best Workout Quality",
          value: String(bestWorkout.workoutQuality),
          date: formatDate(bestWorkout.date),
        }
      : null,
  ].filter((record): record is PersonalRecord => record !== null);
}

function buildHeatmapData(
  recoveryLogs: RecoveryLog[],
  workoutLogs: WorkoutLog[],
  nutritionLogs: NutritionLog[],
): HeatmapDay[] {
  const recoveryDates = new Set(recoveryLogs.map((log) => log.date));
  const workoutDates = new Set(workoutLogs.map((log) => log.date));
  const nutritionDates = new Set(nutritionLogs.map((log) => log.date));

  return Array.from({ length: 84 }).map((_, index) => {
    const date = getDateDaysAgo(83 - index);

    return {
      date,
      recoveryLogged: recoveryDates.has(date),
      workoutLogged: workoutDates.has(date),
      nutritionLogged: nutritionDates.has(date),
    };
  });
}

function buildTrainingRecoveryData(
  recoveryLogs: RecoveryLog[],
  workoutLogs: WorkoutLog[],
): TrainingRecoveryPoint[] {
  const recoveryByDate = new Map(recoveryLogs.map((log) => [log.date, log]));
  const workoutsByDate = new Map<string, WorkoutLog[]>();

  for (const workout of workoutLogs) {
    workoutsByDate.set(workout.date, [...(workoutsByDate.get(workout.date) ?? []), workout]);
  }

  return Array.from({ length: 30 }).map((_, index) => {
    const date = getDateDaysAgo(29 - index);
    const dayWorkouts = workoutsByDate.get(date) ?? [];
    const fatigue =
      dayWorkouts.length > 0
        ? dayWorkouts.reduce((sum, workout) => sum + workout.overallFatigue, 0) /
          dayWorkouts.length
        : 0;

    return {
      date,
      fatigue,
      recoveryScore: recoveryByDate.has(date) ? recoveryScore(recoveryByDate.get(date)!) : 0,
    };
  });
}

async function loadTrendsData(): Promise<LoadedTrendsData> {
  const [recoveryLogs, workoutLogs, nutritionLogs, profiles] = await Promise.all([
    db.recoveryLogs.orderBy("date").toArray(),
    db.workoutLogs.orderBy("date").toArray(),
    db.nutritionLogs.orderBy("date").toArray(),
    db.userProfiles.toArray(),
  ]);
  const userId = profiles[0]?.id ?? recoveryLogs[0]?.userId ?? "guest";
  const correlations = await calculateCorrelations(userId);
  const trends = await analyzeTrends(userId, 30);

  return {
    correlations,
    longTermData: recoveryLogs,
    heatmapData: buildHeatmapData(recoveryLogs, workoutLogs, nutritionLogs),
    personalRecords: buildPersonalRecords(recoveryLogs, workoutLogs),
    trainingRecoveryData: buildTrainingRecoveryData(recoveryLogs, workoutLogs),
    trends,
  };
}

export function useTrendsData(): TrendsData {
  const [data, setData] = useState<LoadedTrendsData>({
    correlations: [],
    longTermData: [],
    heatmapData: [],
    personalRecords: [],
    trainingRecoveryData: [],
    trends: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void loadTrendsData().then((loadedData) => {
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

  return {
    ...data,
    isLoading,
  };
}
