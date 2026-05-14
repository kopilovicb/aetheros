"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useNutritionData } from "@/hooks/useNutritionData";

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function NutritionAnalysis() {
  const { correlations, isLoading, junkFoodImpact, logs, weeklyStats } =
    useNutritionData();
  const fourteenDayLogs = logs.slice(-14);
  const hydrationData = fourteenDayLogs.map((log) => ({
    date: formatDate(log.date),
    hydration: log.hydrationLiters,
  }));
  const caffeineData = fourteenDayLogs.map((log) => ({
    date: formatDate(log.date),
    caffeine: log.caffeineIntake,
  }));

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading nutrition analysis...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyStats.avgMealQuality.toFixed(1)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Meal Quality</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {weeklyStats.avgHydration.toFixed(1)}L
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Hydration</p>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
          <p className="text-2xl font-semibold text-[#f9fafb]">
            {Math.round(weeklyStats.avgCaffeine)}
          </p>
          <p className="mt-1 text-xs text-[#9ca3af]">Avg Caffeine</p>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Hydration — Last 14 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={hydrationData}>
              <CartesianGrid stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid #2a2a2a",
                  color: "#f9fafb",
                }}
              />
              <ReferenceLine stroke="#f59e0b" strokeDasharray="4 4" y={2.5} />
              <Bar dataKey="hydration" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Caffeine Intake — Last 14 Days
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={caffeineData}>
              <defs>
                <linearGradient id="caffeineGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
              <ReferenceLine stroke="#f59e0b" strokeDasharray="4 4" y={200} />
              <Area
                dataKey="caffeine"
                fill="url(#caffeineGradient)"
                stroke="#f59e0b"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
        <h2 className="text-xl font-semibold text-[#f9fafb]">
          Nutrition Correlations
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
            Log more days to unlock nutrition insights
          </p>
        )}
      </section>

      {junkFoodImpact ? (
        <section className="rounded-lg border border-[#f59e0b]/40 bg-[#1a1a1a] p-5">
          <h2 className="text-xl font-semibold text-[#f9fafb]">
            Junk Food Impact
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#9ca3af]">
            Your energy stability averages {junkFoodImpact.difference.toFixed(1)}{" "}
            points lower on days with junk food
          </p>
        </section>
      ) : null}
    </div>
  );
}
