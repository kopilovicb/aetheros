import { db } from "@/lib/db/schema";
import type { RecoveryLog, UserBaseline, WorkoutLog } from "@/types/models";

const BASELINE_WINDOW_DAYS = 30;
const MIN_BASELINE_POINTS = 7;

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

function standardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    values.length;

  return Math.sqrt(variance);
}

async function getRecentRecoveryLogs(userId: string): Promise<RecoveryLog[]> {
  const windowStart = getWindowStartDate(BASELINE_WINDOW_DAYS);

  return db.recoveryLogs
    .where("userId")
    .equals(userId)
    .filter((log) => log.date >= windowStart)
    .sortBy("date");
}

async function getRecentWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  const windowStart = getWindowStartDate(BASELINE_WINDOW_DAYS);

  return db.workoutLogs
    .where("userId")
    .equals(userId)
    .filter((log) => log.date >= windowStart)
    .sortBy("date");
}

export async function calculateBaseline(userId: string): Promise<UserBaseline> {
  const [recoveryLogs, workoutLogs] = await Promise.all([
    getRecentRecoveryLogs(userId),
    getRecentWorkoutLogs(userId),
  ]);

  const sleepScores = recoveryLogs.map((log) => log.sleepScore);
  const sleepDurations = recoveryLogs.map((log) => log.sleepDuration);
  const hrvValues = recoveryLogs.map((log) => log.hrv);
  const bodyBatteryValues = recoveryLogs.map((log) => log.bodyBattery);
  const stressLevels = recoveryLogs.map((log) => log.stressLevel);
  const fatigueLevels = recoveryLogs.map((log) => log.soreness);
  const recoveryScores = recoveryLogs.map(
    (log) =>
      (log.sleepScore + log.bodyBattery + (10 - log.stressLevel) * 10) / 3,
  );
  const workoutQualities = workoutLogs.map((log) => log.workoutQuality);

  const baseline: UserBaseline = {
    userId,
    updatedAt: new Date().toISOString(),
    avgSleepScore: average(sleepScores),
    avgSleepDuration: average(sleepDurations),
    avgHrv: average(hrvValues),
    avgBodyBattery: average(bodyBatteryValues),
    avgStressLevel: average(stressLevels),
    avgFatigueLevel: average(fatigueLevels),
    avgRecoveryScore: average(recoveryScores),
    avgWorkoutQuality: average(workoutQualities),
    hrvStdDev: standardDeviation(hrvValues),
    sleepStdDev: standardDeviation(sleepScores),
  };

  await db.userBaselines.put(baseline);

  return baseline;
}

export async function getBaseline(userId: string): Promise<UserBaseline | null> {
  const baseline = await db.userBaselines.get(userId);
  return baseline ?? null;
}

export async function hasEnoughData(userId: string): Promise<boolean> {
  const recoveryLogs = await getRecentRecoveryLogs(userId);
  return recoveryLogs.length >= MIN_BASELINE_POINTS;
}
