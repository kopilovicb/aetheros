"use client";

import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";

type AdherenceChartProps = {
  supplementName: string;
  data: { date: string; taken: boolean }[];
};

function getBarColor(taken: boolean | null): string {
  if (taken === null) {
    return "#2a2a2a";
  }

  return taken ? "#10b981" : "#ef4444";
}

export function AdherenceChart({ supplementName, data }: AdherenceChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    value: 1,
  }));
  const takenCount = data.filter((item) => item.taken).length;
  const adherencePercentage =
    data.length > 0 ? Math.round((takenCount / data.length) * 100) : 0;

  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-[#f9fafb]">
          {supplementName}
        </p>
        <p className="text-sm text-[#9ca3af]">{adherencePercentage}%</p>
      </div>
      <div className="h-[80px]">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData}>
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {chartData.map((item) => (
                <Cell fill={getBarColor(item.taken)} key={item.date} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
