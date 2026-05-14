import type { RecoveryLog, UserBaseline, WorkoutLog } from "@/types/models";

export interface RuleResult {
  id: string;
  name: string;
  triggered: boolean;
  severity: "info" | "warning" | "alert";
  weight: number;
  fatigueContribution: number;
  message: string;
  confidence: number;
}

function createRuleResult(
  id: string,
  name: string,
  triggered: boolean,
  severity: "info" | "warning" | "alert",
  fatigueContribution: number,
  message: string,
): RuleResult {
  return {
    id,
    name,
    triggered,
    severity,
    weight: fatigueContribution,
    fatigueContribution: triggered ? fatigueContribution : 0,
    message,
    confidence: triggered ? 85 : 0,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getAverageRir(workout: WorkoutLog): number {
  const rirValues = workout.exercises.flatMap((exercise) =>
    exercise.sets.map((set) => set.rir),
  );

  return average(rirValues);
}

function hasLowRirStreak(recentWorkouts: WorkoutLog[]): boolean {
  const workouts = [...recentWorkouts].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const latestThree = workouts.slice(0, 3);

  return (
    latestThree.length >= 3 &&
    latestThree.every((workout) => getAverageRir(workout) < 1)
  );
}

function hasConsecutiveLowSleep(
  baseline: UserBaseline,
  recentLogs: RecoveryLog[],
): boolean {
  const latestThree = [...recentLogs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    latestThree.length >= 3 &&
    average(latestThree.map((log) => log.sleepScore)) <
      baseline.avgSleepScore * 0.85
  );
}

function hasConsistencyStreak(
  log: RecoveryLog,
  recentLogs: RecoveryLog[],
  recentWorkouts: WorkoutLog[],
): boolean {
  const loggedDates = new Set<string>([
    ...recentLogs.map((recentLog) => recentLog.date),
    ...recentWorkouts.map((workout) => workout.date),
  ]);
  const currentDate = new Date(`${log.date}T00:00:00`);

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - index);

    if (!loggedDates.has(date.toISOString().slice(0, 10))) {
      return false;
    }
  }

  return true;
}

export function evaluateRules(
  log: RecoveryLog,
  baseline: UserBaseline,
  recentLogs: RecoveryLog[],
  recentWorkouts: WorkoutLog[],
): RuleResult[] {
  const sleepBelowBaseline =
    log.sleepScore < baseline.avgSleepScore - baseline.sleepStdDev;
  const hrvDropped = log.hrv < baseline.avgHrv - baseline.hrvStdDev;
  const lowRirStreak = hasLowRirStreak(recentWorkouts);

  return [
    createRuleResult(
      "sleep_below_baseline",
      "Sleep Below Baseline",
      sleepBelowBaseline,
      "warning",
      15,
      "Sleep score is below your personal baseline.",
    ),
    createRuleResult(
      "hrv_drop_significant",
      "Significant HRV Drop",
      log.hrv < baseline.avgHrv - 1.5 * baseline.hrvStdDev,
      "alert",
      20,
      "HRV is significantly below your personal baseline.",
    ),
    createRuleResult(
      "hrv_drop_moderate",
      "Moderate HRV Drop",
      hrvDropped,
      "warning",
      10,
      "HRV is below your personal baseline.",
    ),
    createRuleResult(
      "body_battery_low",
      "Low Body Battery",
      log.bodyBattery < 30,
      "warning",
      15,
      "Body battery is low today.",
    ),
    createRuleResult(
      "triple_warning",
      "Triple Warning",
      sleepBelowBaseline && hrvDropped && log.soreness > 7,
      "alert",
      30,
      "Multiple recovery markers are below your personal baseline.",
    ),
    createRuleResult(
      "consecutive_low_sleep",
      "Consecutive Low Sleep",
      hasConsecutiveLowSleep(baseline, recentLogs),
      "warning",
      25,
      "Sleep has been consistently below baseline over the last 3 days.",
    ),
    createRuleResult(
      "low_rir_streak",
      "Low RIR Streak",
      lowRirStreak,
      "warning",
      15,
      "Recent sessions show repeated training close to failure.",
    ),
    createRuleResult(
      "overreaching_pattern",
      "Overreaching Pattern",
      lowRirStreak && log.soreness > 7 && sleepBelowBaseline,
      "alert",
      25,
      "Accumulated fatigue pattern detected.",
    ),
    createRuleResult(
      "recovery_excellent",
      "Excellent Recovery",
      log.hrv > baseline.avgHrv &&
        log.sleepScore > baseline.avgSleepScore &&
        log.bodyBattery > 75,
      "info",
      0,
      "Recovery markers are strong. Good session opportunity.",
    ),
    createRuleResult(
      "consistency_streak",
      "Consistency Streak",
      hasConsistencyStreak(log, recentLogs, recentWorkouts),
      "info",
      0,
      "Great consistency streak.",
    ),
  ];
}
