"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ScoreRing } from "@/components/cards/ScoreRing";
import { useRecoveryData } from "@/hooks/useRecoveryData";
import type { RuleResult } from "@/lib/engines/rules";

function formatRuleName(id: string): string {
  return id
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getRuleIcon(severity: RuleResult["severity"]): string {
  if (severity === "alert") {
    return "🔴";
  }

  if (severity === "warning") {
    return "🟡";
  }

  return "🔵";
}

function getSeverityClass(severity: string): string {
  if (severity === "severe" || severity === "alert") {
    return "border-[#ef4444] text-[#ef4444]";
  }

  if (severity === "significant" || severity === "warning") {
    return "border-[#f59e0b] text-[#f59e0b]";
  }

  return "border-[#6366f1] text-[#6366f1]";
}

function formatChartDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecoveryDetail() {
  const {
    anomalies,
    baseline,
    isLoading,
    logs,
    scores,
    todaysLog,
    triggeredRules,
  } = useRecoveryData();
  const todaysScore = todaysLog ? scores[logs.indexOf(todaysLog)] : null;
  const daysRemaining = Math.max(0, 14 - logs.length);
  const recoveryChartData = logs.map((log, index) => ({
    date: formatChartDate(log.date),
    score: Math.round(scores[index]?.recoveryScore ?? 0),
  }));
  const hrvChartData = logs.map((log) => ({
    date: formatChartDate(log.date),
    hrv: log.hrv,
  }));

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading recovery analysis...
      </div>
    );
  }

  if (!todaysLog) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Complete today&apos;s check-in to see recovery analysis.
      </div>
    );
  }

  if (!baseline || !todaysScore) {
    return (
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Recovery Breakdown
        </h2>
        <p className="mt-3 text-sm text-[#9ca3af]">
          Building your baseline... ({daysRemaining} days remaining)
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Recovery Breakdown
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <ScoreRing
            label="Recovery Readiness"
            score={todaysScore.recoveryScore}
            size="lg"
          />
          <ScoreRing
            label="Fatigue Score"
            score={todaysScore.fatigueScore}
            size="lg"
          />
          <ScoreRing
            label="Sleep Consistency"
            score={todaysScore.sleepConsistencyScore}
            size="lg"
          />
          <ScoreRing
            label="Nervous System"
            score={todaysScore.nervousSystemScore}
            size="lg"
          />
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          What&apos;s affecting your recovery
        </h2>
        <div className="mt-4 space-y-3">
          {triggeredRules.length ? (
            triggeredRules.map((rule) => (
              <article
                className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
                key={rule.id}
              >
                <div className="flex items-start gap-3">
                  <span>{getRuleIcon(rule.severity)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-[#f9fafb]">
                      {formatRuleName(rule.id)}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#9ca3af]">
                      {rule.message}
                    </p>
                    <p className="mt-2 text-xs text-[#f59e0b]">
                      +{rule.fatigueContribution} fatigue points
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-[#10b981]/40 bg-[#111111] p-4 text-sm text-[#10b981]">
              All recovery markers look good today.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Recovery Score — Last 30 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={recoveryChartData}>
              <defs>
                <linearGradient id="recoveryGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <ReferenceLine stroke="#10b981" strokeDasharray="4 4" y={67} />
              <ReferenceLine stroke="#ef4444" strokeDasharray="4 4" y={34} />
              <Area
                dataKey="score"
                fill="url(#recoveryGradient)"
                stroke="#6366f1"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          HRV — Last 30 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={hrvChartData}>
              <defs>
                <linearGradient id="hrvGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <ReferenceLine
                stroke="#9ca3af"
                strokeDasharray="4 4"
                y={baseline.avgHrv}
              />
              <Area
                dataKey="hrv"
                fill="url(#hrvGradient)"
                stroke="#10b981"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {anomalies.length ? (
        <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-semibold text-[#f9fafb]">
            Anomalies Detected
          </h2>
          <div className="mt-4 space-y-3">
            {anomalies.map((anomaly) => (
              <article
                className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
                key={anomaly.metric}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-[#f9fafb]">
                    {formatRuleName(anomaly.metric)}
                  </h3>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs ${getSeverityClass(
                      anomaly.severity,
                    )}`}
                  >
                    {anomaly.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#9ca3af]">
                  {anomaly.message}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
