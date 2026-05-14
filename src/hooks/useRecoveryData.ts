"use client";

import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { detectAnomalies, type AnomalyResult } from "@/lib/engines/anomaly";
import {
  calculateDailyScores,
  type DailyScores,
} from "@/lib/engines/scoring";
import type { RuleResult } from "@/lib/engines/rules";
import type { RecoveryLog, UserBaseline, WorkoutLog } from "@/types/models";

type RecoveryData = {
  logs: RecoveryLog[];
  todaysLog: RecoveryLog | null;
  baseline: UserBaseline | null;
  scores: DailyScores[];
  anomalies: AnomalyResult[];
  triggeredRules: RuleResult[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

type LoadedRecoveryData = Omit<RecoveryData, "isLoading" | "refresh">;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

async function loadRecoveryData(): Promise<LoadedRecoveryData> {
  const today = getTodayDate();
  const windowStart = getWindowStartDate(30);
  const [logs, baselines, workouts] = await Promise.all([
    db.recoveryLogs.where("date").aboveOrEqual(windowStart).sortBy("date"),
    db.userBaselines.toArray(),
    db.workoutLogs.orderBy("date").toArray() as Promise<WorkoutLog[]>,
  ]);
  const baseline = baselines[0] ?? null;
  const todaysLog = logs.find((log) => log.date === today) ?? null;
  const scores = baseline
    ? logs.map((log) =>
        calculateDailyScores(
          log,
          baseline,
          logs.filter((recentLog) => recentLog.date <= log.date),
          workouts.filter((workout) => workout.date <= log.date),
        ),
      )
    : [];
  const todaysScore =
    todaysLog && baseline
      ? calculateDailyScores(todaysLog, baseline, logs, workouts)
      : null;

  return {
    logs,
    todaysLog,
    baseline,
    scores,
    anomalies: todaysLog && baseline ? detectAnomalies(todaysLog, baseline) : [],
    triggeredRules: todaysScore?.triggeredRules ?? [],
  };
}

export function useRecoveryData(): RecoveryData {
  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  const [todaysLog, setTodaysLog] = useState<RecoveryLog | null>(null);
  const [baseline, setBaseline] = useState<UserBaseline | null>(null);
  const [scores, setScores] = useState<DailyScores[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [triggeredRules, setTriggeredRules] = useState<RuleResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyData = (data: LoadedRecoveryData) => {
    setLogs(data.logs);
    setTodaysLog(data.todaysLog);
    setBaseline(data.baseline);
    setScores(data.scores);
    setAnomalies(data.anomalies);
    setTriggeredRules(data.triggeredRules);
    setIsLoading(false);
  };

  const refresh = useCallback(async () => {
    applyData(await loadRecoveryData());
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadRecoveryData().then((data) => {
      if (isMounted) {
        applyData(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    logs,
    todaysLog,
    baseline,
    scores,
    anomalies,
    triggeredRules,
    isLoading,
    refresh,
  };
}
