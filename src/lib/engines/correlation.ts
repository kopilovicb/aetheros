import { db } from "@/lib/db/schema";
import { calculateBaseline, getBaseline } from "@/lib/engines/baseline";
import { calculateDailyScores } from "@/lib/engines/scoring";
import type { NutritionLog, RecoveryLog, WorkoutLog } from "@/types/models";

export interface CorrelationResult {
  metricA: string;
  metricB: string;
  coefficient: number;
  strength: "weak" | "moderate" | "strong";
  direction: "positive" | "negative";
  dataPoints: number;
  insight: string;
}

const MIN_CORRELATION_POINTS = 14;
const CORRELATION_WINDOW_DAYS = 30;

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

function getStrength(coefficient: number): "weak" | "moderate" | "strong" {
  const absoluteCoefficient = Math.abs(coefficient);

  if (absoluteCoefficient < 0.3) {
    return "weak";
  }

  if (absoluteCoefficient < 0.6) {
    return "moderate";
  }

  return "strong";
}

function createInsight(
  metricA: string,
  metricB: string,
  coefficient: number,
  strength: "weak" | "moderate" | "strong",
): string {
  const direction = coefficient >= 0 ? "positive" : "negative";
  return `${metricA} has a ${strength} ${direction} correlation with ${metricB} (r=${coefficient.toFixed(2)}).`;
}

function createCorrelationResult(
  metricA: string,
  metricB: string,
  xValues: number[],
  yValues: number[],
): CorrelationResult | null {
  if (xValues.length < MIN_CORRELATION_POINTS) {
    return null;
  }

  const coefficient = calculatePearson(xValues, yValues);
  const strength = getStrength(coefficient);

  return {
    metricA,
    metricB,
    coefficient,
    strength,
    direction: coefficient >= 0 ? "positive" : "negative",
    dataPoints: xValues.length,
    insight: createInsight(metricA, metricB, coefficient, strength),
  };
}

function pushPair(
  xValues: number[],
  yValues: number[],
  xValue: number | undefined,
  yValue: number | undefined,
): void {
  if (xValue === undefined || yValue === undefined) {
    return;
  }

  xValues.push(xValue);
  yValues.push(yValue);
}

async function getRecentRecoveryLogs(userId: string): Promise<RecoveryLog[]> {
  const windowStart = getWindowStartDate(CORRELATION_WINDOW_DAYS);

  return db.recoveryLogs
    .where("userId")
    .equals(userId)
    .filter((log) => log.date >= windowStart)
    .sortBy("date");
}

async function getRecentNutritionLogs(userId: string): Promise<NutritionLog[]> {
  const windowStart = getWindowStartDate(CORRELATION_WINDOW_DAYS);

  return db.nutritionLogs
    .where("userId")
    .equals(userId)
    .filter((log) => log.date >= windowStart)
    .sortBy("date");
}

async function getRecentWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  const windowStart = getWindowStartDate(CORRELATION_WINDOW_DAYS);

  return db.workoutLogs
    .where("userId")
    .equals(userId)
    .filter((log) => log.date >= windowStart)
    .sortBy("date");
}

export function calculatePearson(
  xValues: number[],
  yValues: number[],
): number {
  const n = xValues.length;

  if (n === 0 || n !== yValues.length) {
    return 0;
  }

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);
  const denominator = Math.sqrt(
    (n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2),
  );

  if (denominator === 0) {
    return 0;
  }

  return (n * sumXY - sumX * sumY) / denominator;
}

export async function calculateCorrelations(
  userId: string,
): Promise<CorrelationResult[]> {
  const [recoveryLogs, nutritionLogs, workoutLogs] = await Promise.all([
    getRecentRecoveryLogs(userId),
    getRecentNutritionLogs(userId),
    getRecentWorkoutLogs(userId),
  ]);
  const baseline = (await getBaseline(userId)) ?? (await calculateBaseline(userId));
  const recoveryByDate = new Map(recoveryLogs.map((log) => [log.date, log]));
  const workoutByDate = new Map(
    workoutLogs.reduce<[string, WorkoutLog[]][]>((entries, workout) => {
      const existingEntry = entries.find(([date]) => date === workout.date);
      if (existingEntry) {
        existingEntry[1].push(workout);
      } else {
        entries.push([workout.date, [workout]]);
      }

      return entries;
    }, []),
  );
  const sleepToNextEnergyX: number[] = [];
  const sleepToNextEnergyY: number[] = [];
  const hydrationToEnergyX: number[] = [];
  const hydrationToEnergyY: number[] = [];
  const hrvToRecoveryX: number[] = [];
  const hrvToRecoveryY: number[] = [];
  const stressToSleepX: number[] = [];
  const stressToSleepY: number[] = [];
  const caffeineToSleepX: number[] = [];
  const caffeineToSleepY: number[] = [];

  for (const recoveryLog of recoveryLogs) {
    const nextDayRecoveryLog = recoveryByDate.get(getNextDate(recoveryLog.date));
    pushPair(
      sleepToNextEnergyX,
      sleepToNextEnergyY,
      recoveryLog.sleepScore,
      nextDayRecoveryLog?.energyLevel,
    );
    pushPair(
      stressToSleepX,
      stressToSleepY,
      recoveryLog.stressLevel,
      recoveryLog.sleepScore,
    );

    const recentRecoveryLogs = recoveryLogs.filter(
      (log) => log.date <= recoveryLog.date,
    );
    const recentWorkouts = (workoutByDate.get(recoveryLog.date) ?? []).concat(
      workoutLogs.filter((workout) => workout.date < recoveryLog.date),
    );
    const dailyScores = calculateDailyScores(
      recoveryLog,
      baseline,
      recentRecoveryLogs,
      recentWorkouts,
    );
    pushPair(
      hrvToRecoveryX,
      hrvToRecoveryY,
      recoveryLog.hrv,
      dailyScores.recoveryScore,
    );
  }

  for (const nutritionLog of nutritionLogs) {
    const recoveryLog = recoveryByDate.get(nutritionLog.date);
    pushPair(
      hydrationToEnergyX,
      hydrationToEnergyY,
      nutritionLog.hydrationLiters,
      recoveryLog?.energyLevel,
    );
    pushPair(
      caffeineToSleepX,
      caffeineToSleepY,
      nutritionLog.caffeineIntake,
      recoveryLog?.sleepDuration,
    );
  }

  return [
    createCorrelationResult(
      "sleepScore",
      "next day energyLevel",
      sleepToNextEnergyX,
      sleepToNextEnergyY,
    ),
    createCorrelationResult(
      "hydrationLiters",
      "energyLevel",
      hydrationToEnergyX,
      hydrationToEnergyY,
    ),
    createCorrelationResult(
      "hrv",
      "recoveryScore",
      hrvToRecoveryX,
      hrvToRecoveryY,
    ),
    createCorrelationResult(
      "stressLevel",
      "sleepScore",
      stressToSleepX,
      stressToSleepY,
    ),
    createCorrelationResult(
      "caffeineIntake",
      "sleepDuration",
      caffeineToSleepX,
      caffeineToSleepY,
    ),
  ].filter((result): result is CorrelationResult => result !== null);
}
