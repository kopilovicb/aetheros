"use client";

import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import type { WorkoutLog } from "@/types/models";

export type WeeklyStats = {
  sessionCount: number;
  avgQuality: number;
  avgRir: number;
};

export type VolumeByMuscle = {
  muscleGroup: string;
  sets: number;
};

export type StagnationFlag = {
  exerciseName: string;
  sessions: number;
};

type TrainingData = {
  workouts: WorkoutLog[];
  weeklyStats: WeeklyStats;
  volumeByMuscle: VolumeByMuscle[];
  stagnationFlags: StagnationFlag[];
  isLoading: boolean;
};

type LoadedTrainingData = Omit<TrainingData, "isLoading">;

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

function getWorkoutRirValues(workout: WorkoutLog): number[] {
  return workout.exercises.flatMap((exercise) =>
    exercise.sets.map((set) => set.rir),
  );
}

function calculateVolumeByMuscle(workouts: WorkoutLog[]): VolumeByMuscle[] {
  const volume = new Map<string, number>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      volume.set(
        exercise.muscleGroup,
        (volume.get(exercise.muscleGroup) ?? 0) + exercise.sets.length,
      );
    }
  }

  return Array.from(volume.entries()).map(([muscleGroup, sets]) => ({
    muscleGroup,
    sets,
  }));
}

function detectStagnation(workouts: WorkoutLog[]): StagnationFlag[] {
  const thirtyDayStart = getWindowStartDate(30);
  const exerciseSessions = new Map<string, { date: string; maxWeight: number }[]>();

  for (const workout of workouts.filter((workout) => workout.date >= thirtyDayStart)) {
    for (const exercise of workout.exercises) {
      const maxWeight = Math.max(...exercise.sets.map((set) => set.weight), 0);
      const sessions = exerciseSessions.get(exercise.name) ?? [];
      sessions.push({ date: workout.date, maxWeight });
      exerciseSessions.set(exercise.name, sessions);
    }
  }

  return Array.from(exerciseSessions.entries()).flatMap(
    ([exerciseName, sessions]) => {
      const latestSessions = sessions
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-3);

      if (latestSessions.length < 3) {
        return [];
      }

      const firstWeight = latestSessions[0].maxWeight;
      const hasIncreased = latestSessions.some(
        (session) => session.maxWeight > firstWeight,
      );

      return hasIncreased ? [] : [{ exerciseName, sessions: latestSessions.length }];
    },
  );
}

async function loadTrainingData(): Promise<LoadedTrainingData> {
  const workouts = (await db.workoutLogs
    .orderBy("date")
    .reverse()
    .toArray()) as WorkoutLog[];
  const sevenDayStart = getWindowStartDate(7);
  const weeklyWorkouts = workouts.filter((workout) => workout.date >= sevenDayStart);
  const rirValues = weeklyWorkouts.flatMap(getWorkoutRirValues);

  return {
    workouts,
    weeklyStats: {
      sessionCount: weeklyWorkouts.length,
      avgQuality: average(weeklyWorkouts.map((workout) => workout.workoutQuality)),
      avgRir: average(rirValues),
    },
    volumeByMuscle: calculateVolumeByMuscle(weeklyWorkouts),
    stagnationFlags: detectStagnation(workouts),
  };
}

export function useTrainingData(): TrainingData {
  const [data, setData] = useState<LoadedTrainingData>({
    workouts: [],
    weeklyStats: {
      sessionCount: 0,
      avgQuality: 0,
      avgRir: 0,
    },
    volumeByMuscle: [],
    stagnationFlags: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loadedData = await loadTrainingData();
    setData(loadedData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadTrainingData().then((loadedData) => {
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
    isLoading,
  };
}
