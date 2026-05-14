"use client";

import { InsightsFilter } from "@/components/cards/InsightsFilter";
import { InsightsList } from "@/components/cards/InsightsList";
import { useInsightsData } from "@/hooks/useInsightsData";

export default function InsightsPage() {
  const {
    activeFilter,
    filteredInsights,
    isLoading,
    setFilter,
  } = useInsightsData();

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header>
          <h1 className="text-3xl font-semibold">Insights</h1>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Personalized signals generated from your own recovery data.
          </p>
        </header>
        <InsightsFilter activeFilter={activeFilter} onSelect={setFilter} />
        {isLoading ? (
          <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
            Loading insights...
          </div>
        ) : (
          <InsightsList insights={filteredInsights} />
        )}
      </div>
    </main>
  );
}
