import { evaluateRules, type RuleResult } from "@/lib/engines/rules";
import type { RecoveryLog, UserBaseline, WorkoutLog } from "@/types/models";

export interface DailyScores {
  recoveryScore: number;
  fatigueScore: number;
  sleepConsistencyScore: number;
  nervousSystemScore: number;
  zone: "red" | "yellow" | "green";
  triggeredRules: RuleResult[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function variance(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  return (
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    values.length
  );
}

function getZone(recoveryScore: number): "red" | "yellow" | "green" {
  if (recoveryScore >= 67) {
    return "green";
  }

  if (recoveryScore >= 34) {
    return "yellow";
  }

  return "red";
}

export function calculateDailyScores(
  log: RecoveryLog,
  baseline: UserBaseline,
  recentLogs: RecoveryLog[],
  recentWorkouts: WorkoutLog[],
): DailyScores {
  const triggeredRules = evaluateRules(
    log,
    baseline,
    recentLogs,
    recentWorkouts,
  ).filter((rule) => rule.triggered);
  const fatigueScore = clampScore(
    triggeredRules.reduce(
      (sum, rule) => sum + rule.fatigueContribution,
      0,
    ),
  );
  const recoveryScore = clampScore(100 - fatigueScore);
  const sleepScores = [...recentLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .map((recentLog) => recentLog.sleepScore);
  const sleepConsistencyScore = clampScore(
    100 - Math.min(variance(sleepScores) * 2, 100),
  );
  const hrvComponent =
    baseline.avgHrv > 0 ? (log.hrv / baseline.avgHrv) * 50 : 0;
  const nervousSystemScore = clampScore(
    hrvComponent + log.bodyBattery * 0.3 + (10 - log.stressLevel) * 2,
  );

  return {
    recoveryScore,
    fatigueScore,
    sleepConsistencyScore,
    nervousSystemScore,
    zone: getZone(recoveryScore),
    triggeredRules,
  };
}
