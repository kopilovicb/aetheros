import type { RecoveryLog, UserBaseline } from "@/types/models";

export interface AnomalyResult {
  metric: string;
  value: number;
  zScore: number;
  severity: "moderate" | "significant" | "severe";
  message: string;
}

type MetricBaseline = {
  metric: string;
  value: number;
  mean: number;
  stdDev: number;
};

function getSeverity(
  absoluteZScore: number,
): "moderate" | "significant" | "severe" {
  if (absoluteZScore > 2.5) {
    return "severe";
  }

  if (absoluteZScore > 2) {
    return "significant";
  }

  return "moderate";
}

function formatMessage(metric: string, zScore: number): string {
  const direction = zScore > 0 ? "above" : "below";
  return `${metric} is unusually ${direction} your personal baseline.`;
}

export function detectAnomalies(
  log: RecoveryLog,
  baseline: UserBaseline,
): AnomalyResult[] {
  const metrics: MetricBaseline[] = [
    {
      metric: "hrv",
      value: log.hrv,
      mean: baseline.avgHrv,
      stdDev: baseline.hrvStdDev,
    },
    {
      metric: "sleepScore",
      value: log.sleepScore,
      mean: baseline.avgSleepScore,
      stdDev: baseline.sleepStdDev,
    },
    {
      metric: "bodyBattery",
      value: log.bodyBattery,
      mean: baseline.avgBodyBattery,
      stdDev: baseline.sleepStdDev,
    },
    {
      metric: "energyLevel",
      value: log.energyLevel,
      mean: baseline.avgRecoveryScore / 10,
      stdDev: baseline.sleepStdDev / 10,
    },
  ];

  return metrics.flatMap((metric) => {
    if (metric.stdDev === 0) {
      return [];
    }

    const zScore = (metric.value - metric.mean) / metric.stdDev;
    const absoluteZScore = Math.abs(zScore);

    if (absoluteZScore <= 1.5) {
      return [];
    }

    return [
      {
        metric: metric.metric,
        value: metric.value,
        zScore,
        severity: getSeverity(absoluteZScore),
        message: formatMessage(metric.metric, zScore),
      },
    ];
  });
}
