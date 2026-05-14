"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ScoreRing } from "@/components/cards/ScoreRing";
import { useSleepData } from "@/hooks/useSleepData";

function formatChartDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SleepDetail() {
  const {
    avgDuration,
    avgSleepScore,
    baseline,
    bestNight,
    consistencyScore,
    correlations,
    isLoading,
    logs,
  } = useSleepData();
  const sleepScoreData = logs.map((log) => ({
    date: formatChartDate(log.date),
    sleepScore: log.sleepScore,
  }));
  const sleepDurationData = logs.map((log) => ({
    date: formatChartDate(log.date),
    sleepDuration: log.sleepDuration,
  }));

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading sleep analysis...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-center">
        <div className="flex justify-center">
          <ScoreRing
            label="Sleep Consistency"
            score={consistencyScore}
            size="lg"
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-[#9ca3af]">
          Based on variance in your sleep scores over the last 7 days
        </p>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Sleep Score — Last 30 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={sleepScoreData}>
              <defs>
                <linearGradient id="sleepScoreGradient" x1="0" x2="0" y1="0" y2="1">
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
              {baseline ? (
                <ReferenceLine
                  stroke="#9ca3af"
                  strokeDasharray="4 4"
                  y={baseline.avgSleepScore}
                />
              ) : null}
              <Area
                dataKey="sleepScore"
                fill="url(#sleepScoreGradient)"
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
          Sleep Duration — Last 30 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={sleepDurationData}>
              <defs>
                <linearGradient id="sleepDurationGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis domain={[4, 12]} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <ReferenceArea fill="#10b981" fillOpacity={0.08} y1={7} y2={9} />
              <Area
                dataKey="sleepDuration"
                fill="url(#sleepDurationGradient)"
                stroke="#10b981"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {Math.round(avgSleepScore)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Sleep Score</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {avgDuration.toFixed(1)}h
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Duration</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {bestNight ? bestNight.sleepScore : 0}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">
            {bestNight ? `Best Night ${bestNight.date}` : "Best Night"}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Sleep Insights
        </h2>
        {correlations.length ? (
          <div className="mt-4 space-y-3">
            {correlations.map((correlation) => (
              <article
                className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4 text-sm leading-6 text-[#9ca3af]"
                key={`${correlation.metricA}-${correlation.metricB}`}
              >
                {correlation.insight}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9ca3af]">
            Log more data to unlock sleep correlations
          </p>
        )}
      </section>
    </div>
  );
}
