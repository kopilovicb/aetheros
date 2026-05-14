import { db, type InsightRecord } from "@/lib/db/schema";
import { aetherAI } from "@/lib/ai/transformers";
import { detectAnomalies } from "@/lib/engines/anomaly";
import { evaluateRules } from "@/lib/engines/rules";
import { analyzeTrends } from "@/lib/engines/trends";
import type { RecoveryLog, UserBaseline } from "@/types/models";

export interface Insight {
  id: string;
  category: "recovery" | "sleep" | "training" | "nutrition" | "lifestyle";
  severity: "info" | "warning" | "alert";
  message: string;
  recommendation: string;
  confidence: number;
  triggeredBy: string;
  rawData: Record<string, number | string>;
  date: string;
  createdAt: string;
}

type RuleTemplateMap = Record<string, string>;

const RULE_MESSAGES: RuleTemplateMap = {
  sleep_below_baseline:
    "Your sleep quality last night was below your personal baseline. Recovery may be impacted today.",
  hrv_drop_significant:
    "Significant HRV drop detected. Your nervous system shows signs of elevated stress or insufficient recovery.",
  hrv_drop_moderate:
    "Moderate HRV decline noted. Consider monitoring your training load today.",
  body_battery_low:
    "Body battery is critically low. Prioritize rest and recovery activities.",
  triple_warning:
    "Multiple recovery markers are below your baseline simultaneously. This warrants attention.",
  consecutive_low_sleep:
    "You've had below-baseline sleep for 3+ consecutive days. Sleep debt may be accumulating.",
  overreaching_pattern:
    "Training load indicators suggest possible overreaching. A deload may be beneficial.",
  recovery_excellent:
    "All recovery markers are strong. Conditions look favorable for a quality training session.",
  consistency_streak:
    "You're on a great logging streak. Consistency is key to accurate insights.",
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function getRecommendation(severity: Insight["severity"]): string {
  if (severity === "alert") {
    return "Consider reducing training intensity by 30-40% today and prioritize recovery inputs.";
  }

  if (severity === "warning") {
    return "Monitor how you feel during warm-up before deciding on intensity.";
  }

  return "Keep up the consistent logging to maintain insight accuracy.";
}

function getRuleCategory(ruleId: string): Insight["category"] {
  if (ruleId.includes("sleep")) {
    return "sleep";
  }

  if (ruleId.includes("rir") || ruleId.includes("overreaching")) {
    return "training";
  }

  return "recovery";
}

function getAnomalySeverity(
  severity: "moderate" | "significant" | "severe",
): Insight["severity"] {
  if (severity === "severe") {
    return "alert";
  }

  if (severity === "significant") {
    return "warning";
  }

  return "info";
}

function toInsightRecord(userId: string, insight: Insight): InsightRecord {
  return {
    ...insight,
    userId,
  };
}

function toInsight(record: InsightRecord): Insight {
  return {
    id: record.id,
    category: isInsightCategory(record.category) ? record.category : "recovery",
    severity: record.severity,
    message: record.message,
    recommendation: record.recommendation ?? "",
    confidence: record.confidence ?? 0,
    triggeredBy: record.triggeredBy ?? "unknown",
    rawData: record.rawData ?? {},
    date: record.date,
    createdAt: record.createdAt,
  };
}

function isInsightCategory(category: string): category is Insight["category"] {
  return (
    category === "recovery" ||
    category === "sleep" ||
    category === "training" ||
    category === "nutrition" ||
    category === "lifestyle"
  );
}

function getRecoveryRawData(
  log: RecoveryLog,
  baseline: UserBaseline,
  recoveryScore: number,
): Record<string, number | string> {
  return {
    recoveryScore,
    hrv: log.hrv,
    baselineHrv: baseline.avgHrv.toFixed(1),
    sleepScore: log.sleepScore,
    baselineSleepScore: baseline.avgSleepScore.toFixed(1),
    bodyBattery: log.bodyBattery,
    stressLevel: log.stressLevel,
  };
}

function getAIPrompt(insight: Insight): string {
  const score =
    typeof insight.rawData.recoveryScore === "number"
      ? insight.rawData.recoveryScore
      : "unknown";

  return `Recovery score: ${score}/100. Primary concern: ${insight.triggeredBy}. Severity: ${insight.severity}.
Write a calm, scientific, coach-like recovery insight in 1-2 sentences:`;
}

function enhanceInsightWithAI(userId: string, insight: Insight): void {
  if (!aetherAI.ready) {
    return;
  }

  void aetherAI
    .generate({
      prompt: getAIPrompt(insight),
      fallback: insight.message,
    })
    .then(async (result) => {
      if (!result.usedAI || !result.text) {
        return;
      }

      const enhancedInsight = {
        ...insight,
        message: result.text,
      };
      await db.insights.put(toInsightRecord(userId, enhancedInsight));
    })
    .catch(() => {
      // Template messages remain the fallback when local AI is unavailable.
    });
}

export async function generateInsights(userId: string): Promise<Insight[]> {
  const today = getTodayDate();
  const sevenDayStart = getWindowStartDate(7);
  const [todaysLog, baseline, recentLogs, recentWorkouts] = await Promise.all([
    db.recoveryLogs.where("date").equals(today).first(),
    db.userBaselines.get(userId),
    db.recoveryLogs
      .where("userId")
      .equals(userId)
      .filter((log) => log.date >= sevenDayStart)
      .sortBy("date"),
    db.workoutLogs
      .where("userId")
      .equals(userId)
      .filter((log) => log.date >= sevenDayStart)
      .sortBy("date"),
  ]);

  if (!todaysLog || !baseline) {
    return [];
  }

  const createdAt = new Date().toISOString();
  const triggeredRules = evaluateRules(
    todaysLog,
    baseline,
    recentLogs,
    recentWorkouts,
  ).filter((rule) => rule.triggered);
  const fatigueScore = clampScore(
    triggeredRules.reduce((sum, rule) => sum + rule.fatigueContribution, 0),
  );
  const recoveryScore = clampScore(100 - fatigueScore);
  const ruleInsights = triggeredRules.map<Insight>((rule) => ({
    id: `${userId}-${today}-rule-${rule.id}`,
    category: getRuleCategory(rule.id),
    severity: rule.severity,
    message: RULE_MESSAGES[rule.id] ?? rule.message,
    recommendation: getRecommendation(rule.severity),
    confidence: rule.confidence,
    triggeredBy: rule.id,
    rawData: getRecoveryRawData(todaysLog, baseline, recoveryScore),
    date: today,
    createdAt,
  }));

  const anomalyInsights = detectAnomalies(todaysLog, baseline).map<Insight>(
    (anomaly) => {
      const severity = getAnomalySeverity(anomaly.severity);

      return {
        id: `${userId}-${today}-anomaly-${anomaly.metric}`,
        category: anomaly.metric === "sleepScore" ? "sleep" : "recovery",
        severity,
        message: anomaly.message,
        recommendation: getRecommendation(severity),
        confidence: Math.min(95, Math.round(Math.abs(anomaly.zScore) * 30)),
        triggeredBy: `${anomaly.metric}_anomaly`,
        rawData: {
          recoveryScore,
          metric: anomaly.metric,
          value: anomaly.value,
          zScore: anomaly.zScore.toFixed(2),
        },
        date: today,
        createdAt,
      };
    },
  );

  const trendInsights = (await analyzeTrends(userId, 30))
    .filter((trend) => trend.direction === "declining")
    .map<Insight>((trend) => ({
      id: `${userId}-${today}-trend-${trend.metric}`,
      category: trend.metric === "sleepScore" ? "sleep" : "recovery",
      severity: "warning",
      message: `${trend.metric} is declining over the last ${trend.window} days.`,
      recommendation: getRecommendation("warning"),
      confidence: 75,
      triggeredBy: `${trend.metric}_declining_trend`,
      rawData: {
        recoveryScore,
        metric: trend.metric,
        changePercent: trend.changePercent.toFixed(1),
        streak: trend.streak,
      },
      date: today,
      createdAt,
    }));

  const insights = [...ruleInsights, ...anomalyInsights, ...trendInsights];

  await db.insights.bulkPut(
    insights.map((insight) => toInsightRecord(userId, insight)),
  );
  insights.forEach((insight) => enhanceInsightWithAI(userId, insight));

  return insights;
}

export async function getInsightHistory(
  userId: string,
  category?: string,
): Promise<Insight[]> {
  const records = await db.insights
    .where("userId")
    .equals(userId)
    .reverse()
    .sortBy("createdAt");
  const insights = records.map(toInsight);

  if (!category || category === "all") {
    return insights;
  }

  return insights.filter((insight) => insight.category === category);
}
