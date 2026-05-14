"use client";

import { useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { calculatePearson } from "@/lib/engines/correlation";
import type { LifestyleLog, RecoveryLog } from "@/types/models";

type LifestyleMetric = "mood" | "motivation" | "focus" | "productivity" | "energy" | "stress";

export type LifestyleAverages = Record<LifestyleMetric, number>;
export type LifestyleTrends = Record<LifestyleMetric, "up" | "down" | "stable">;

export type LifestyleCorrelation = {
  id: string;
  coefficient: number;
  insight: string;
  direction: "positive" | "negative";
};

export type WeeklyConsistency = {
  loggedDays: number;
  days: { date: string; label: string; logged: boolean }[];
};

type LifestyleData = {
  logs: LifestyleLog[];
  weeklyAverages: LifestyleAverages;
  trends: LifestyleTrends;
  correlations: LifestyleCorrelation[];
  weeklyConsistency: WeeklyConsistency;
  isLoading: boolean;
};

type LoadedLifestyleData = Omit<LifestyleData, "isLoading">;

const METRICS: LifestyleMetric[] = [
  "mood",
  "motivation",
  "focus",
  "productivity",
  "energy",
  "stress",
];

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

function lifestyleScore(log: LifestyleLog): number {
  return average([
    log.mood,
    log.motivation,
    log.focus,
    log.productivity,
    log.energy,
    10 - log.stress,
  ]);
}

function recoveryScore(log: RecoveryLog): number {
  return Math.max(
    0,
    Math.min(100, (log.sleepScore + log.bodyBattery + (10 - log.stressLevel) * 10) / 3),
  );
}

function emptyAverages(): LifestyleAverages {
  return {
    mood: 0,
    motivation: 0,
    focus: 0,
    productivity: 0,
    energy: 0,
    stress: 0,
  };
}

function calculateWeeklyAverages(logs: LifestyleLog[]): LifestyleAverages {
  const sevenDayStart = getWindowStartDate(7);
  const weeklyLogs = logs.filter((log) => log.date >= sevenDayStart);

  return METRICS.reduce<LifestyleAverages>((averages, metric) => {
    averages[metric] = average(weeklyLogs.map((log) => log[metric]));
    return averages;
  }, emptyAverages());
}

function calculateTrends(logs: LifestyleLog[]): LifestyleTrends {
  const latestLogs = logs.slice(-7);
  const previousLogs = logs.slice(-14, -7);

  return METRICS.reduce<LifestyleTrends>((trends, metric) => {
    const latestAverage = average(latestLogs.map((log) => log[metric]));
    const previousAverage = average(previousLogs.map((log) => log[metric]));
    const change = latestAverage - previousAverage;

    trends[metric] = Math.abs(change) < 0.25 ? "stable" : change > 0 ? "up" : "down";
    return trends;
  }, {
    mood: "stable",
    motivation: "stable",
    focus: "stable",
    productivity: "stable",
    energy: "stable",
    stress: "stable",
  });
}

function calculateWeeklyConsistency(logs: LifestyleLog[]): WeeklyConsistency {
  const loggedDates = new Set(logs.map((log) => log.date));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateString = date.toISOString().slice(0, 10);

    return {
      date: dateString,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      logged: loggedDates.has(dateString),
    };
  });

  return {
    loggedDays: days.filter((day) => day.logged).length,
    days,
  };
}

function buildCorrelations(
  lifestyleLogs: LifestyleLog[],
  recoveryLogs: RecoveryLog[],
): LifestyleCorrelation[] {
  const recoveryByDate = new Map(recoveryLogs.map((log) => [log.date, log]));
  const stressValues = recoveryLogs.map((log) => log.stressLevel);
  const sleepValues = recoveryLogs.map((log) => log.sleepScore);
  const lifestyleValues: number[] = [];
  const nextDayRecoveryValues: number[] = [];
  const correlations: LifestyleCorrelation[] = [];

  if (stressValues.length >= 14) {
    const coefficient = calculatePearson(stressValues, sleepValues);

    if (Math.abs(coefficient) > 0.3) {
      correlations.push({
        id: "stress_sleep",
        coefficient,
        insight: `Your sleep quality appears to correlate with stress levels (r=${coefficient.toFixed(2)})`,
        direction: coefficient >= 0 ? "positive" : "negative",
      });
    }
  }

  for (const log of lifestyleLogs) {
    const nextRecoveryLog = recoveryByDate.get(getNextDate(log.date));

    if (nextRecoveryLog) {
      lifestyleValues.push(lifestyleScore(log));
      nextDayRecoveryValues.push(recoveryScore(nextRecoveryLog));
    }
  }

  if (lifestyleValues.length >= 14) {
    const coefficient = calculatePearson(lifestyleValues, nextDayRecoveryValues);

    if (Math.abs(coefficient) > 0.3) {
      correlations.push({
        id: "lifestyle_recovery",
        coefficient,
        insight: `Your lifestyle score appears to correlate with next-day recovery (r=${coefficient.toFixed(2)})`,
        direction: coefficient >= 0 ? "positive" : "negative",
      });
    }
  }

  return correlations;
}

async function loadLifestyleData(): Promise<LoadedLifestyleData> {
  const windowStart = getWindowStartDate(30);
  const [logs, recoveryLogs] = await Promise.all([
    db.lifestyleLogs.where("date").aboveOrEqual(windowStart).sortBy("date"),
    db.recoveryLogs.where("date").aboveOrEqual(windowStart).sortBy("date"),
  ]);

  return {
    logs,
    weeklyAverages: calculateWeeklyAverages(logs),
    trends: calculateTrends(logs),
    correlations: buildCorrelations(logs, recoveryLogs),
    weeklyConsistency: calculateWeeklyConsistency(logs),
  };
}

export function useLifestyleData(): LifestyleData {
  const [data, setData] = useState<LoadedLifestyleData>({
    logs: [],
    weeklyAverages: emptyAverages(),
    trends: {
      mood: "stable",
      motivation: "stable",
      focus: "stable",
      productivity: "stable",
      energy: "stable",
      stress: "stable",
    },
    correlations: [],
    weeklyConsistency: {
      loggedDays: 0,
      days: [],
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void loadLifestyleData().then((loadedData) => {
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
