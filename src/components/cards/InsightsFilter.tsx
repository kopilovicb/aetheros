"use client";

import type { InsightFilter } from "@/hooks/useInsightsData";

type InsightsFilterProps = {
  activeFilter: InsightFilter;
  onSelect: (filter: InsightFilter) => void;
};

const FILTERS: { label: string; value: InsightFilter }[] = [
  { label: "All", value: "all" },
  { label: "Recovery", value: "recovery" },
  { label: "Sleep", value: "sleep" },
  { label: "Training", value: "training" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Lifestyle", value: "lifestyle" },
];

export function InsightsFilter({
  activeFilter,
  onSelect,
}: InsightsFilterProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2">
        {FILTERS.map((filter) => (
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
              activeFilter === filter.value
                ? "bg-[#6366f1] text-white"
                : "bg-[#1a1a1a] text-[#9ca3af]"
            }`}
            key={filter.value}
            type="button"
            onClick={() => onSelect(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
