/**
 * Core domain types (local + cloud sync schema).
 */

/** Calendar day in `YYYY-MM-DD` format */
export type DateString = string;

/** Stored as ISO 8601, e.g. `2026-05-11T12:00:00.000Z` */
export type TimestampString = string;

export interface RecoveryLog {
  id: string;
  userId: string;
  date: DateString;
  sleepScore: number;
  sleepDuration: number;
  hrv: number;
  bodyBattery: number;
  stressLevel: number;
  soreness: number;
  energyLevel: number;
  notes: string;
  createdAt: TimestampString;
  updatedAt: TimestampString;
}

export interface Set {
  reps: number;
  weight: number;
  rir: number;
}

export interface Exercise {
  name: string;
  muscleGroup: string;
  sets: Set[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: DateString;
  name: string;
  exercises: Exercise[];
  overallFatigue: number;
  overallSoreness: number;
  workoutQuality: number;
  sessionFeeling: number;
  notes: string;
  createdAt: TimestampString;
}

/** Meal timing quality buckets */
export type MealTimingQuality = "good" | "irregular" | "poor";

/** Rough protein intake signal */
export type ProteinAdequacy = "high" | "medium" | "low";

export interface NutritionLog {
  id: string;
  userId: string;
  date: DateString;
  mealQuality: number;
  hydrationLiters: number;
  caffeineIntake: number;
  mealTiming: MealTimingQuality;
  proteinAdequacy: ProteinAdequacy;
  junkFoodToday: boolean;
  energyStability: number;
  notes: string;
}

export interface SupplementEntry {
  name: string;
  dosage: string;
  timing: string;
  taken: boolean;
  purpose: string;
}

export interface SupplementLog {
  id: string;
  userId: string;
  date: DateString;
  supplements: SupplementEntry[];
}

export interface LifestyleLog {
  id: string;
  userId: string;
  date: DateString;
  mood: number;
  motivation: number;
  focus: number;
  productivity: number;
  energy: number;
  stress: number;
  notes: string;
}

/** User settings bag — constrain keys when preferences UI is modeled */
export type UserPreferences = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface UserProfile {
  id: string;
  name: string;
  baselinePeriodComplete: boolean;
  onboardingComplete: boolean;
  preferences: UserPreferences;
}

export interface UserBaseline {
  userId: string;
  updatedAt: TimestampString;
  avgSleepScore: number;
  avgSleepDuration: number;
  avgHrv: number;
  avgBodyBattery: number;
  avgStressLevel: number;
  avgFatigueLevel: number;
  avgRecoveryScore: number;
  avgWorkoutQuality: number;
  hrvStdDev: number;
  sleepStdDev: number;
}
