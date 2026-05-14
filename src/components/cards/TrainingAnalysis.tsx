"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { db } from "@/lib/db/schema";
import { useTrainingData } from "@/hooks/useTrainingData";
import type { RecoveryLog, WorkoutLog } from "@/types/models";

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getWorkoutAvgRir(workout: WorkoutLog): number {
  return average(
    workout.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => set.rir),
    ),
  );
}

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function hasLowRirStreak(workouts: WorkoutLog[]): boolean {
  const latestThree = [...workouts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return latestThree.length >= 3 && latestThree.every((workout) => getWorkoutAvgRir(workout) < 1);
}

function isFatigueTrendingUp(workouts: WorkoutLog[]): boolean {
  const latestFive = [...workouts]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5);

  return latestFive.length >= 5 && latestFive.at(-1)!.overallFatigue > latestFive[0].overallFatigue;
}

export function TrainingAnalysis() {
  const {
    isLoading,
    stagnationFlags,
    volumeByMuscle,
    weeklyStats,
    workouts,
  } = useTrainingData();
  const [latestRecoveryLog, setLatestRecoveryLog] = useState<RecoveryLog | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    void db.recoveryLogs
      .orderBy("date")
      .reverse()
      .first()
      .then((log) => {
        if (isMounted) {
          setLatestRecoveryLog(log ?? null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fourteenDayStart = getWindowStartDate(14);
  const fatigueChartData = useMemo(
    () =>
      workouts
        .filter((workout) => workout.date >= fourteenDayStart)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((workout) => ({
          date: formatDate(workout.date),
          fatigue: workout.overallFatigue,
        })),
    [fourteenDayStart, workouts],
  );
  const lowRirStreak = hasLowRirStreak(workouts);
  const overreachingPattern =
    lowRirStreak &&
    Boolean(latestRecoveryLog) &&
    latestRecoveryLog!.soreness > 7 &&
    latestRecoveryLog!.sleepScore < 60;
  const fatigueTrendingUp = isFatigueTrendingUp(workouts);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading training analysis...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyStats.sessionCount}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Sessions This Week</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyStats.avgQuality.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Workout Quality</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyStats.avgRir.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg RIR</p>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Weekly Volume by Muscle Group
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={volumeByMuscle}>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="muscleGroup" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <Bar dataKey="sets" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Session Fatigue — Last 14 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={fatigueChartData}>
              <defs>
                <linearGradient id="fatigueGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <Area
                dataKey="fatigue"
                fill="url(#fatigueGradient)"
                stroke="#f59e0b"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {fatigueTrendingUp ? (
          <div className="mt-4 rounded-lg border border-[#f59e0b]/40 bg-[#111111] p-4 text-sm text-[#f59e0b]">
            Fatigue is accumulating. Consider a deload.
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Overreaching Detection
        </h2>
        {overreachingPattern ? (
          <div className="mt-4 rounded-lg border border-[#ef4444]/40 bg-[#111111] p-4 text-sm text-[#ef4444]">
            Accumulated fatigue pattern detected.
          </div>
        ) : lowRirStreak ? (
          <div className="mt-4 rounded-lg border border-[#f59e0b]/40 bg-[#111111] p-4 text-sm text-[#f59e0b]">
            Recent sessions show repeated training close to failure.
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#10b981]/40 bg-[#111111] p-4 text-sm text-[#10b981]">
            No overreaching patterns detected.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Stagnation Detection
        </h2>
        {stagnationFlags.length ? (
          <div className="mt-4 rounded-lg border border-[#6366f1]/40 bg-[#111111] p-4 text-sm text-[#9ca3af]">
            <p className="text-[#f9fafb]">Potential stagnation:</p>
            <p className="mt-2">{stagnationFlags.map((flag) => flag.exerciseName).join(", ")}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9ca3af]">
            No stagnation patterns detected yet.
          </p>
        )}
      </section>
    </div>
  );
}
