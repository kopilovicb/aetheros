"use client";

import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import {
  calculateDailyScores,
  type DailyScores,
} from "@/lib/engines/scoring";
import type {
  RecoveryLog,
  SupplementLog,
  UserBaseline,
  UserProfile,
  WorkoutLog,
} from "@/types/models";

type DashboardData = {
  todaysLog: RecoveryLog | null;
  recentLogs: RecoveryLog[];
  userProfile: UserProfile | null;
  userBaseline: UserBaseline | null;
  todaysSupplementLog: SupplementLog | null;
  dailyScores: DailyScores | null;
  streak: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

type LoadedDashboardData = {
  todaysLog: RecoveryLog | null;
  recentLogs: RecoveryLog[];
  userProfile: UserProfile | null;
  userBaseline: UserBaseline | null;
  todaysSupplementLog: SupplementLog | null;
  dailyScores: DailyScores | null;
  streak: number;
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(logs: RecoveryLog[]): number {
  const loggedDates = new Set(logs.map((log) => log.date));
  const cursor = new Date(`${getTodayDate()}T00:00:00`);
  let streak = 0;

  while (loggedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

async function loadDashboardData(): Promise<LoadedDashboardData> {
  const today = getTodayDate();
  const sevenDayStart = getWindowStartDate(7);

  const [
    todayLog,
    sevenDayLogs,
    allRecoveryLogs,
    profiles,
    baselines,
    supplementLog,
    workouts,
  ] = await Promise.all([
    db.recoveryLogs.where("date").equals(today).first(),
    db.recoveryLogs.where("date").aboveOrEqual(sevenDayStart).sortBy("date"),
    db.recoveryLogs.orderBy("date").toArray(),
    db.userProfiles.toArray(),
    db.userBaselines.toArray(),
    db.supplementLogs.where("date").equals(today).first(),
    db.workoutLogs.orderBy("date").toArray() as Promise<WorkoutLog[]>,
  ]);
  const profile = profiles[0] ?? null;
  const baseline = baselines[0] ?? null;
  const scores =
    todayLog && baseline
      ? calculateDailyScores(todayLog, baseline, sevenDayLogs, workouts)
      : null;

  return {
    todaysLog: todayLog ?? null,
    recentLogs: sevenDayLogs,
    userProfile: profile,
    userBaseline: baseline,
    todaysSupplementLog: supplementLog ?? null,
    dailyScores: scores,
    streak: calculateStreak(allRecoveryLogs),
  };
}

export function useDashboardData(): DashboardData {
  const [todaysLog, setTodaysLog] = useState<RecoveryLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecoveryLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userBaseline, setUserBaseline] = useState<UserBaseline | null>(null);
  const [todaysSupplementLog, setTodaysSupplementLog] =
    useState<SupplementLog | null>(null);
  const [dailyScores, setDailyScores] = useState<DailyScores | null>(null);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadDashboardData();

    setTodaysLog(data.todaysLog);
    setRecentLogs(data.recentLogs);
    setUserProfile(data.userProfile);
    setUserBaseline(data.userBaseline);
    setTodaysSupplementLog(data.todaysSupplementLog);
    setDailyScores(data.dailyScores);
    setStreak(data.streak);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadDashboardData().then((data) => {
      if (!isMounted) {
        return;
      }

      setTodaysLog(data.todaysLog);
      setRecentLogs(data.recentLogs);
      setUserProfile(data.userProfile);
      setUserBaseline(data.userBaseline);
      setTodaysSupplementLog(data.todaysSupplementLog);
      setDailyScores(data.dailyScores);
      setStreak(data.streak);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  return {
    todaysLog,
    recentLogs,
    userProfile,
    userBaseline,
    todaysSupplementLog,
    dailyScores,
    streak,
    isLoading,
    refresh,
  };
}
