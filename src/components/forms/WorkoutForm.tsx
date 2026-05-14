"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type { Exercise, Set, WorkoutLog } from "@/types/models";

type ExerciseDraft = Exercise;

type WorkoutFormState = {
  name: string;
  date: string;
  overallFatigue: number;
  sessionFeeling: number;
  workoutQuality: number;
  overallSoreness: number;
  notes: string;
  exercises: ExerciseDraft[];
};

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
  "Cardio",
];

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function createEmptySet(): Set {
  return {
    reps: 10,
    weight: 0,
    rir: 2,
  };
}

function createEmptyExercise(): ExerciseDraft {
  return {
    name: "",
    muscleGroup: "Chest",
    sets: [createEmptySet()],
  };
}

function createInitialState(): WorkoutFormState {
  return {
    name: "",
    date: getTodayDate(),
    overallFatigue: 5,
    sessionFeeling: 5,
    workoutQuality: 5,
    overallSoreness: 5,
    notes: "",
    exercises: [createEmptyExercise()],
  };
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[#f9fafb]">{label}</Label>
        <span className="rounded bg-[#111111] px-2 py-1 text-sm text-[#f9fafb]">
          {value}
        </span>
      </div>
      <input
        className="w-full accent-[#6366f1]"
        max={10}
        min={0}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

export function WorkoutForm() {
  const { user } = useUserStore();
  const [formState, setFormState] =
    useState<WorkoutFormState>(createInitialState);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void db.workoutLogs.toArray().then((workouts) => {
      if (!isMounted) {
        return;
      }

      setExerciseNames(
        Array.from(
          new Set(
            workouts.flatMap((workout) =>
              workout.exercises.map((exercise) => exercise.name),
            ),
          ),
        ).filter(Boolean),
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateFormState = (updates: Partial<WorkoutFormState>) => {
    setFormState((currentState) => ({ ...currentState, ...updates }));
  };

  const updateExercise = (index: number, updates: Partial<ExerciseDraft>) => {
    updateFormState({
      exercises: formState.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, ...updates } : exercise,
      ),
    });
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<Set>,
  ) => {
    const exercise = formState.exercises[exerciseIndex];
    updateExercise(exerciseIndex, {
      sets: exercise.sets.map((set, currentSetIndex) =>
        currentSetIndex === setIndex ? { ...set, ...updates } : set,
      ),
    });
  };

  const addExercise = () => {
    updateFormState({
      exercises: [...formState.exercises, createEmptyExercise()],
    });
  };

  const removeExercise = (index: number) => {
    updateFormState({
      exercises: formState.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
    });
  };

  const addSet = (exerciseIndex: number) => {
    const exercise = formState.exercises[exerciseIndex];
    updateExercise(exerciseIndex, {
      sets: [...exercise.sets, createEmptySet()],
    });
  };

  const submitWorkout = async () => {
    const validExercises = formState.exercises.filter(
      (exercise) => exercise.name.trim() && exercise.sets.length > 0,
    );

    if (!formState.name.trim() || validExercises.length === 0) {
      setErrorMessage("Workout name and at least one exercise with one set are required.");
      return;
    }

    setErrorMessage(null);

    const log: WorkoutLog = {
      id: crypto.randomUUID(),
      userId: user?.id ?? "guest",
      date: formState.date,
      name: formState.name.trim(),
      exercises: validExercises.map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
      })),
      overallFatigue: formState.overallFatigue,
      overallSoreness: formState.overallSoreness,
      workoutQuality: formState.workoutQuality,
      sessionFeeling: formState.sessionFeeling,
      notes: formState.notes,
      createdAt: new Date().toISOString(),
    };

    await db.workoutLogs.add(log);
    await addToSyncQueue("workout_logs", "insert", { ...log });

    setSuccessMessage("Workout saved!");
    setFormState(createInitialState());
    window.setTimeout(() => setSuccessMessage(null), 1800);
  };

  return (
    <section className="space-y-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#f9fafb]">Session Info</h1>
        <div className="space-y-2">
          <Label htmlFor="workoutName">Workout name</Label>
          <Input
            id="workoutName"
            placeholder="Push Day"
            value={formState.name}
            onChange={(event) => updateFormState({ name: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workoutDate">Date</Label>
          <Input
            id="workoutDate"
            type="date"
            value={formState.date}
            onChange={(event) => updateFormState({ date: event.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SliderField
            label="Overall Fatigue before workout"
            value={formState.overallFatigue}
            onChange={(overallFatigue) => updateFormState({ overallFatigue })}
          />
          <SliderField
            label="Session Feeling after workout"
            value={formState.sessionFeeling}
            onChange={(sessionFeeling) => updateFormState({ sessionFeeling })}
          />
          <SliderField
            label="Workout Quality"
            value={formState.workoutQuality}
            onChange={(workoutQuality) => updateFormState({ workoutQuality })}
          />
          <SliderField
            label="Overall Soreness"
            value={formState.overallSoreness}
            onChange={(overallSoreness) => updateFormState({ overallSoreness })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workoutNotes">Notes</Label>
          <textarea
            className="min-h-24 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f9fafb] outline-none"
            id="workoutNotes"
            value={formState.notes}
            onChange={(event) => updateFormState({ notes: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#f9fafb]">Exercises</h2>
          <Button
            className="bg-[#6366f1] text-white hover:bg-[#5558df]"
            type="button"
            onClick={addExercise}
          >
            Add Exercise
          </Button>
        </div>
        <datalist id="previousExercises">
          {exerciseNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <div className="space-y-4">
          {formState.exercises.map((exercise, exerciseIndex) => (
            <div
              className="space-y-4 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
              key={exerciseIndex}
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
                <Input
                  list="previousExercises"
                  placeholder="Exercise name"
                  value={exercise.name}
                  onChange={(event) =>
                    updateExercise(exerciseIndex, { name: event.target.value })
                  }
                />
                <select
                  className="h-10 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-sm text-[#f9fafb]"
                  value={exercise.muscleGroup}
                  onChange={(event) =>
                    updateExercise(exerciseIndex, {
                      muscleGroup: event.target.value,
                    })
                  }
                >
                  {MUSCLE_GROUPS.map((muscleGroup) => (
                    <option key={muscleGroup} value={muscleGroup}>
                      {muscleGroup}
                    </option>
                  ))}
                </select>
                <Button
                  disabled={formState.exercises.length === 1}
                  type="button"
                  variant="outline"
                  onClick={() => removeExercise(exerciseIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {exercise.sets.map((set, setIndex) => (
                  <div className="grid grid-cols-3 gap-2" key={setIndex}>
                    <Input
                      min="0"
                      placeholder="Reps"
                      type="number"
                      value={set.reps}
                      onChange={(event) =>
                        updateSet(exerciseIndex, setIndex, {
                          reps: Number(event.target.value),
                        })
                      }
                    />
                    <Input
                      min="0"
                      placeholder="kg"
                      type="number"
                      value={set.weight}
                      onChange={(event) =>
                        updateSet(exerciseIndex, setIndex, {
                          weight: Number(event.target.value),
                        })
                      }
                    />
                    <Input
                      max="5"
                      min="0"
                      placeholder="RIR"
                      type="number"
                      value={set.rir}
                      onChange={(event) =>
                        updateSet(exerciseIndex, setIndex, {
                          rir: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addSet(exerciseIndex)}
              >
                Add Set
              </Button>
            </div>
          ))}
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="text-sm text-[#10b981]">{successMessage}</p>
      ) : null}
      <Button
        className="h-12 w-full bg-[#6366f1] text-base text-white hover:bg-[#5558df]"
        size="lg"
        type="button"
        onClick={submitWorkout}
      >
        Save Workout
      </Button>
    </section>
  );
}
