"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

type SparklineProps = {
  data: number[];
  label: string;
  currentValue: number;
};

export function Sparkline({ data, label, currentValue }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="min-w-0 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-[#9ca3af]">{label}</p>
        <p className="text-sm font-semibold text-[#f9fafb]">
          {Math.round(currentValue)}
        </p>
      </div>
      <div className="h-[60px]">
        {data.length < 2 ? (
          <div className="flex h-full items-center text-xs text-[#6b7280]">
            Not enough data yet
          </div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData}>
              <Line
                dataKey="value"
                dot={false}
                isAnimationActive={false}
                stroke="#6366f1"
                strokeLinecap="round"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
