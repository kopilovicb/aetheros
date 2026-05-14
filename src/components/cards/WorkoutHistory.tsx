"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTrainingData } from "@/hooks/useTrainingData";
import type { WorkoutLog } from "@/types/models";

function getQualityClass(score: number): string {
  if (score >= 7) {
    return "bg-[#10b981]/15 text-[#10b981]";
  }

  if (score >= 4) {
    return "bg-[#f59e0b]/15 text-[#f59e0b]";
  }

  return "bg-[#ef4444]/15 text-[#ef4444]";
}

function getTotalSets(workout: WorkoutLog): number {
  return workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WorkoutHistory() {
  const { isLoading, workouts } = useTrainingData();
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading workout history...
      </div>
    );
  }

  if (!workouts.length) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-8 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/15 text-[#6366f1]">
            <Dumbbell className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[#f9fafb]">
            No workouts logged yet
          </p>
          <p className="mt-2 text-sm text-[#6b7280]">
            Start tracking session quality, RIR, and fatigue patterns.
          </p>
          <Button className="mt-5 w-full bg-[#6366f1] text-white hover:bg-[#5558df] sm:w-auto">
            Log Your First Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => {
        const isExpanded = expandedWorkoutId === workout.id;

        return (
          <article
            className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5"
            key={workout.id}
          >
            <button
              className="w-full text-left"
              type="button"
              onClick={() =>
                setExpandedWorkoutId(isExpanded ? null : workout.id)
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#f9fafb]">
                    {workout.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#9ca3af]">
                    {formatDate(workout.date)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${getQualityClass(
                    workout.workoutQuality,
                  )}`}
                >
                  Quality {workout.workoutQuality}/10
                </span>
              </div>
              <p className="mt-3 text-sm text-[#9ca3af]">
                {workout.exercises.length} exercises · {getTotalSets(workout)} sets
              </p>
            </button>

            {isExpanded ? (
              <div className="mt-4 space-y-3 border-t border-[#2a2a2a] pt-4">
                {workout.exercises.map((exercise) => (
                  <div
                    className="rounded-md bg-[#111111] p-3"
                    key={`${workout.id}-${exercise.name}`}
                  >
                    <p className="font-medium text-[#f9fafb]">
                      {exercise.name}
                    </p>
                    <p className="mt-1 text-xs text-[#9ca3af]">
                      {exercise.muscleGroup}
                    </p>
                    <div className="mt-3 space-y-2">
                      {exercise.sets.map((set, index) => (
                        <p className="text-sm text-[#9ca3af]" key={index}>
                          Set {index + 1}: {set.reps} reps · {set.weight} kg · RIR{" "}
                          {set.rir}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
