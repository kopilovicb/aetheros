"use client";

import { useEffect, useState } from "react";
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

import { db } from "@/lib/db/schema";
import type { RecoveryLog } from "@/types/models";

type Range = 30 | 60 | 90;

function getWindowStartDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return date.toISOString().slice(0, 10);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function recoveryScore(log: RecoveryLog): number {
  return Math.round((log.sleepScore + log.bodyBattery + (10 - log.stressLevel) * 10) / 3);
}

function MetricChart({
  title,
  color,
  data,
  dataKey,
  baseline,
}: {
  title: string;
  color: string;
  data: Record<string, string | number>[];
  dataKey: string;
  baseline: number;
}) {
  const gradientId = `${dataKey}Gradient`;

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-lg font-semibold text-[#f9fafb]">{title}</h2>
      <div className="mt-4 h-56">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
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
            <ReferenceLine stroke="#9ca3af" strokeDasharray="4 4" y={baseline} />
            <Area
              dataKey={dataKey}
              fill={`url(#${gradientId})`}
              stroke={color}
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function LongTermCharts() {
  const [range, setRange] = useState<Range>(30);
  const [logs, setLogs] = useState<RecoveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void db.recoveryLogs
      .where("date")
      .aboveOrEqual(getWindowStartDate(range))
      .sortBy("date")
      .then((loadedLogs) => {
        if (!isMounted) {
          return;
        }

        setLogs(loadedLogs);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [range]);

  const chartData = logs.map((log) => ({
    date: formatDate(log.date),
    recovery: recoveryScore(log),
    hrv: log.hrv,
    sleep: log.sleepScore,
    energy: log.energyLevel,
  }));

  return (
    <section className="space-y-4">
      <div className="flex gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1">
        {([30, 60, 90] as Range[]).map((value) => (
          <button
            className={`flex-1 rounded-md px-3 py-2 text-sm ${
              range === value ? "bg-[#6366f1] text-white" : "text-[#9ca3af]"
            }`}
            key={value}
            type="button"
            onClick={() => setRange(value)}
          >
            {value}D
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
          Loading long-term charts...
        </div>
      ) : logs.length < 7 ? (
        <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
          Not enough data for this range yet
        </div>
      ) : (
        <>
          <MetricChart
            baseline={average(logs.map(recoveryScore))}
            color="#6366f1"
            data={chartData}
            dataKey="recovery"
            title="Recovery Score Trend"
          />
          <MetricChart
            baseline={average(logs.map((log) => log.hrv))}
            color="#10b981"
            data={chartData}
            dataKey="hrv"
            title="HRV Trend"
          />
          <MetricChart
            baseline={average(logs.map((log) => log.sleepScore))}
            color="#8b5cf6"
            data={chartData}
            dataKey="sleep"
            title="Sleep Score Trend"
          />
          <MetricChart
            baseline={average(logs.map((log) => log.energyLevel))}
            color="#f59e0b"
            data={chartData}
            dataKey="energy"
            title="Energy Level Trend"
          />
        </>
      )}
    </section>
  );
}
