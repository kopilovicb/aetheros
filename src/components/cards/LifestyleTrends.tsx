"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLifestyleData, type LifestyleTrends as TrendMap } from "@/hooks/useLifestyleData";

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function trendArrow(metric: keyof TrendMap, trends: TrendMap): string {
  if (trends[metric] === "up") {
    return "↑";
  }

  if (trends[metric] === "down") {
    return "↓";
  }

  return "→";
}

export function LifestyleTrends() {
  const {
    correlations,
    isLoading,
    logs,
    trends,
    weeklyAverages,
    weeklyConsistency,
  } = useLifestyleData();
  const chartData = logs.slice(-14).map((log) => ({
    date: formatDate(log.date),
    mood: log.mood,
    energy: log.energy,
    stress: log.stress,
    motivation: log.motivation,
  }));

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading lifestyle trends...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyAverages.mood.toFixed(1)} {trendArrow("mood", trends)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Mood</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyAverages.energy.toFixed(1)} {trendArrow("energy", trends)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Energy</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyAverages.stress.toFixed(1)} {trendArrow("stress", trends)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Stress</p>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Lifestyle Metrics — Last 14 Days
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <Legend />
              <Line dataKey="mood" dot={false} stroke="#6366f1" strokeWidth={2} type="monotone" />
              <Line dataKey="energy" dot={false} stroke="#10b981" strokeWidth={2} type="monotone" />
              <Line dataKey="stress" dot={false} stroke="#ef4444" strokeWidth={2} type="monotone" />
              <Line dataKey="motivation" dot={false} stroke="#f59e0b" strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Lifestyle Correlations
        </h2>
        {correlations.length ? (
          <div className="mt-4 space-y-3">
            {correlations.map((correlation) => (
              <article
                className={`rounded-lg border bg-[#111111] p-4 text-sm leading-6 ${
                  correlation.direction === "negative"
                    ? "border-[#ef4444]/40 text-[#ef4444]"
                    : "border-[#10b981]/40 text-[#10b981]"
                }`}
                key={correlation.id}
              >
                {correlation.insight}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9ca3af]">
            Log at least 14 days to unlock lifestyle correlations
          </p>
        )}
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Weekly Consistency
        </h2>
        <p className="mt-2 text-sm text-[#9ca3af]">
          {weeklyConsistency.loggedDays} of 7 days logged this week
        </p>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {weeklyConsistency.days.map((day) => (
            <div key={day.date} className="space-y-2 text-center">
              <div
                className="h-8 rounded"
                style={{
                  backgroundColor: day.logged ? "#6366f1" : "#2a2a2a",
                }}
              />
              <p className="text-xs text-[#9ca3af]">{day.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
