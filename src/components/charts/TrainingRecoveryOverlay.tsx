"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTrendsData } from "@/hooks/useTrendsData";

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TrainingRecoveryOverlay() {
  const { isLoading, trainingRecoveryData } = useTrendsData();
  const chartData = trainingRecoveryData.map((point) => ({
    ...point,
    date: formatDate(point.date),
  }));
  const hasRiskPattern = trainingRecoveryData.some(
    (point) => point.fatigue >= 7 && point.recoveryScore > 0 && point.recoveryScore < 34,
  );

  if (isLoading) {
    return (
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading training recovery overlay...
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-xl font-semibold text-[#f9fafb]">
        Training Load vs Recovery
      </h2>
      <div className="mt-4 h-72">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} stroke="#6b7280" tick={{ fontSize: 12 }} yAxisId="fatigue" />
            <YAxis domain={[0, 100]} orientation="right" stroke="#6b7280" tick={{ fontSize: 12 }} yAxisId="recovery" />
            <Tooltip
              contentStyle={{
                background: "#111111",
                border: "1px solid #2a2a2a",
                color: "#f9fafb",
              }}
            />
            <Legend />
            <Bar dataKey="fatigue" fill="#f59e0b" name="Workout Fatigue" yAxisId="fatigue" />
            <Line
              dataKey="recoveryScore"
              dot={false}
              name="Recovery Score"
              stroke="#10b981"
              strokeWidth={2}
              type="monotone"
              yAxisId="recovery"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {hasRiskPattern ? (
        <div className="mt-4 rounded-lg border border-[#f59e0b]/40 bg-[#111111] p-4 text-sm text-[#f59e0b]">
          Training load is high while recovery is low on recent logged days.
        </div>
      ) : null}
    </section>
  );
}
