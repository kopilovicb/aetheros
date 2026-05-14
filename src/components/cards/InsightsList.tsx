"use client";

import { useState } from "react";
import { Brain } from "lucide-react";

import type { Insight } from "@/lib/engines/insights";

type InsightsListProps = {
  insights: Insight[];
};

function getSeverityBorder(severity: Insight["severity"]): string {
  if (severity === "alert") {
    return "border-l-[#ef4444]";
  }

  if (severity === "warning") {
    return "border-l-[#f59e0b]";
  }

  return "border-l-[#6366f1]";
}

function formatCategory(category: Insight["category"]): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatRelativeDate(createdAt: string): string {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - createdTime) / 86_400_000);

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  return `${diffDays} days ago`;
}

function formatRawData(rawData: Insight["rawData"]): string {
  return Object.entries(rawData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

export function InsightsList({ insights }: InsightsListProps) {
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  if (!insights.length) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-8 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/15 text-[#6366f1]">
            <Brain className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[#f9fafb]">
            No insights yet
          </p>
          <p className="mt-2 text-sm text-[#6b7280]">
            Log a few days of data to unlock insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const isExpanded = expandedInsightId === insight.id;

        return (
          <article
            className={`cursor-pointer rounded-lg border border-l-4 border-[#2a2a2a] bg-[#1a1a1a] p-5 ${getSeverityBorder(
              insight.severity,
            )}`}
            key={insight.id}
            onClick={() => setExpandedInsightId(isExpanded ? null : insight.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[#111111] px-2 py-1 text-xs text-[#9ca3af]">
                {formatCategory(insight.category)}
              </span>
              <span className="text-xs text-[#6b7280]">
                {formatRelativeDate(insight.createdAt)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#f9fafb]">
              {insight.message}
            </p>
            <p className="mt-3 text-xs text-[#6b7280]">
              {insight.confidence}% confidence
            </p>

            {isExpanded ? (
              <div className="mt-4 space-y-3 border-t border-[#2a2a2a] pt-4 text-sm text-[#9ca3af]">
                <p>
                  <span className="text-[#f9fafb]">Triggered by:</span>{" "}
                  {insight.triggeredBy}
                </p>
                <p>
                  <span className="text-[#f9fafb]">Raw data:</span>{" "}
                  {formatRawData(insight.rawData)}
                </p>
                <p>
                  <span className="text-[#f9fafb]">Recommendation:</span>{" "}
                  {insight.recommendation}
                </p>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
