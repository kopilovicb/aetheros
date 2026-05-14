"use client";

import { useTrendsData } from "@/hooks/useTrendsData";

export function PersonalRecords() {
  const { isLoading, personalRecords } = useTrendsData();

  if (isLoading) {
    return (
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading personal records...
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-xl font-semibold text-[#f9fafb]">Personal Records</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {personalRecords.map((record) => (
          <article
            className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
            key={record.metric}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl text-[#f59e0b]">🏆</span>
              <div>
                <h3 className="font-medium text-[#f9fafb]">{record.metric}</h3>
                <p className="mt-1 text-2xl font-semibold text-[#f59e0b]">
                  {record.value}
                </p>
                <p className="mt-1 text-sm text-[#9ca3af]">{record.date}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
