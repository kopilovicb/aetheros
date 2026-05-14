"use client";

import { useEffect, useState } from "react";

import {
  generateInsights,
  getInsightHistory,
  type Insight,
} from "@/lib/engines/insights";
import { useUserStore } from "@/store/userStore";

export type InsightFilter =
  | "all"
  | "recovery"
  | "sleep"
  | "training"
  | "nutrition"
  | "lifestyle";

type InsightsData = {
  insights: Insight[];
  filteredInsights: Insight[];
  activeFilter: InsightFilter;
  setFilter: (filter: InsightFilter) => void;
  isLoading: boolean;
};

export function useInsightsData(): InsightsData {
  const { user } = useUserStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeFilter, setActiveFilter] = useState<InsightFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadInsights = async () => {
      const userId = user?.id ?? "guest";
      await generateInsights(userId);
      const history = await getInsightHistory(userId);

      if (!isMounted) {
        return;
      }

      setInsights(history);
      setIsLoading(false);
    };

    void loadInsights();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return {
    insights,
    filteredInsights:
      activeFilter === "all"
        ? insights
        : insights.filter((insight) => insight.category === activeFilter),
    activeFilter,
    setFilter: setActiveFilter,
    isLoading,
  };
}
