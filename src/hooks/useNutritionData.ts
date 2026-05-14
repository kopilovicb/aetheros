"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { calculatePearson } from "@/lib/engines/correlation";
import type { NutritionLog } from "@/types/models";

export type NutritionWeeklyStats = {
  avgMealQuality: number;
  avgHydration: number;
  avgCaffeine: number;
};

export type NutritionCorrelation = {
  metricA: string;
  metricB: string;
  coefficient: number;
  dataPoints: number;
  insight: string;
};

export type JunkFoodImpact = {
  junkFoodAvgEnergy: number;
  nonJunkFoodAvgEnergy: number;
  difference: number;
} | null;

type NutritionData = {
  logs: NutritionLog[];
  weeklyStats: NutritionWeeklyStats;
  correlations: NutritionCorrelation[];
  junkFoodImpact: JunkFoodImpact;
  isLoading: boolean;
};

type LoadedNutritionData = Omit<NutritionData, "isLoading">;

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function getNextDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildCorrelation(
  metricA: string,
  metricB: string,
  xValues: number[],
  yValues: number[],
  insight: (coefficient: number) => string,
): NutritionCorrelation | null {
  if (xValues.length < 14) {
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
    insight: insight(coefficient),
  };
}

async function loadNutritionData(): Promise<LoadedNutritionData> {
  const thirtyDayStart = getWindowStartDate(30);
  const sevenDayStart = getWindowStartDate(7);
  const [logs, recoveryLogs, workoutLogs] = await Promise.all([
    db.nutritionLogs
      .where("date")
      .aboveOrEqual(thirtyDayStart)
      .sortBy("date"),
    db.recoveryLogs.where("date").aboveOrEqual(thirtyDayStart).sortBy("date"),
    db.workoutLogs.where("date").aboveOrEqual(thirtyDayStart).sortBy("date"),
  ]);
  const weeklyLogs = logs.filter((log) => log.date >= sevenDayStart);
  const recoveryByDate = new Map(recoveryLogs.map((log) => [log.date, log]));
  const workoutByDate = new Map(workoutLogs.map((log) => [log.date, log]));
  const hydrationValues: number[] = [];
  const nextDayEnergyValues: number[] = [];
  const mealQualityValues: number[] = [];
  const workoutQualityValues: number[] = [];
  const caffeineValues: number[] = [];
  const sleepDurationValues: number[] = [];

  for (const log of logs) {
    const nextRecoveryLog = recoveryByDate.get(getNextDate(log.date));
    const workoutLog = workoutByDate.get(log.date);
    const recoveryLog = recoveryByDate.get(log.date);

    if (nextRecoveryLog) {
      hydrationValues.push(log.hydrationLiters);
      nextDayEnergyValues.push(nextRecoveryLog.energyLevel);
    }

    if (workoutLog) {
      mealQualityValues.push(log.mealQuality);
      workoutQualityValues.push(workoutLog.workoutQuality);
    }

    if (recoveryLog) {
      caffeineValues.push(log.caffeineIntake);
      sleepDurationValues.push(recoveryLog.sleepDuration);
    }
  }

  const junkFoodLogs = logs.filter((log) => log.junkFoodToday);
  const nonJunkFoodLogs = logs.filter((log) => !log.junkFoodToday);
  const junkFoodAvgEnergy = average(
    junkFoodLogs.map((log) => log.energyStability),
  );
  const nonJunkFoodAvgEnergy = average(
    nonJunkFoodLogs.map((log) => log.energyStability),
  );
  const difference = nonJunkFoodAvgEnergy - junkFoodAvgEnergy;

  return {
    logs,
    weeklyStats: {
      avgMealQuality: average(weeklyLogs.map((log) => log.mealQuality)),
      avgHydration: average(weeklyLogs.map((log) => log.hydrationLiters)),
      avgCaffeine: average(weeklyLogs.map((log) => log.caffeineIntake)),
    },
    correlations: [
      buildCorrelation(
        "hydrationLiters",
        "nextDayEnergy",
        hydrationValues,
        nextDayEnergyValues,
        (coefficient) =>
          `Higher hydration correlates with better next-day energy (r=${coefficient.toFixed(2)})`,
      ),
      buildCorrelation(
        "mealQuality",
        "workoutQuality",
        mealQualityValues,
        workoutQualityValues,
        (coefficient) =>
          `Higher meal quality correlates with workout quality (r=${coefficient.toFixed(2)})`,
      ),
      buildCorrelation(
        "caffeineIntake",
        "sleepDuration",
        caffeineValues,
        sleepDurationValues,
        (coefficient) =>
          coefficient < 0
            ? `Higher caffeine correlates with shorter sleep duration (r=${coefficient.toFixed(2)})`
            : `Higher caffeine correlates with longer sleep duration (r=${coefficient.toFixed(2)})`,
      ),
    ].filter(
      (correlation): correlation is NutritionCorrelation =>
        correlation !== null,
    ),
    junkFoodImpact:
      junkFoodLogs.length >= 5 &&
      nonJunkFoodLogs.length >= 5 &&
      Math.abs(difference) > 1
        ? {
            junkFoodAvgEnergy,
            nonJunkFoodAvgEnergy,
            difference,
          }
        : null,
  };
}

export function useNutritionData(): NutritionData {
  const [data, setData] = useState<LoadedNutritionData>({
    logs: [],
    weeklyStats: {
      avgMealQuality: 0,
      avgHydration: 0,
      avgCaffeine: 0,
    },
    correlations: [],
    junkFoodImpact: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void loadNutritionData().then((loadedData) => {
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
