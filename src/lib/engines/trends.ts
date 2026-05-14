import { db } from "@/lib/db/schema";
import type { RecoveryLog } from "@/types/models";

export interface TrendResult {
  metric: string;
  direction: "improving" | "stable" | "declining";
  changePercent: number;
  streak: number;
  window: 7 | 14 | 30;
}

type TrendMetric = "hrv" | "sleepScore" | "bodyBattery" | "energyLevel";

const TREND_METRICS: TrendMetric[] = [
  "hrv",
  "sleepScore",
  "bodyBattery",
  "energyLevel",
];

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

function getMetricValue(log: RecoveryLog, metric: TrendMetric): number {
  return log[metric];
}

function calculateStreak(logs: RecoveryLog[], metric: TrendMetric): number {
  const values = logs.map((log) => getMetricValue(log, metric));
  const overallAverage = average(values);
  const descendingLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;

  for (const log of descendingLogs) {
    if (getMetricValue(log, metric) <= overallAverage) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function getDirection(
  changePercent: number,
): "improving" | "stable" | "declining" {
  if (changePercent > 5) {
    return "improving";
  }

  if (changePercent < -5) {
    return "declining";
  }

  return "stable";
}

export async function analyzeTrends(
  userId: string,
  window: 7 | 14 | 30,
): Promise<TrendResult[]> {
  const windowStart = getWindowStartDate(window);
  const logs = await db.recoveryLogs
    .where("userId")
    .equals(userId)
    .filter((log) => log.date >= windowStart)
    .sortBy("date");

  return TREND_METRICS.map((metric) => {
    const midpoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midpoint);
    const secondHalf = logs.slice(midpoint);
    const firstAverage = average(
      firstHalf.map((log) => getMetricValue(log, metric)),
    );
    const secondAverage = average(
      secondHalf.map((log) => getMetricValue(log, metric)),
    );
    const changePercent =
      firstAverage === 0
        ? 0
        : ((secondAverage - firstAverage) / firstAverage) * 100;

    return {
      metric,
      direction: getDirection(changePercent),
      changePercent,
      streak: calculateStreak(logs, metric),
      window,
    };
  });
}
