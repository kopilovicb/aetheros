"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

import { db } from "@/lib/db/schema";
import { calculateCorrelations, type CorrelationResult } from "@/lib/engines/correlation";

async function loadCorrelations(): Promise<CorrelationResult[]> {
  const [profiles, recoveryLogs] = await Promise.all([
    db.userProfiles.toArray(),
    db.recoveryLogs.toArray(),
  ]);
  const userId = profiles[0]?.id ?? recoveryLogs[0]?.userId ?? "guest";
  const correlations = await calculateCorrelations(userId);

  return correlations
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, 6);
}

function strengthLabel(correlation: CorrelationResult): string {
  return `${correlation.strength.charAt(0).toUpperCase()}${correlation.strength.slice(1)} ${correlation.direction}`;
}

export function CorrelationMatrix() {
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void loadCorrelations().then((loadedCorrelations) => {
      if (!isMounted) {
        return;
      }

      setCorrelations(loadedCorrelations);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading correlations...
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-xl font-semibold text-[#f9fafb]">
        Your Top Correlations
      </h2>
      {correlations.length ? (
        <div className="mt-4 space-y-3">
          {correlations.map((correlation) => {
            const width = `${Math.min(Math.abs(correlation.coefficient) * 50, 50)}%`;
            const isPositive = correlation.coefficient >= 0;

            return (
              <article
                className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4"
                key={`${correlation.metricA}-${correlation.metricB}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-[#f9fafb]">
                    {correlation.metricA} → {correlation.metricB}
                  </h3>
                  <span className="text-sm text-[#9ca3af]">
                    r = {correlation.coefficient.toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
                  <div className="w-1/2">
                    {!isPositive ? (
                      <div
                        className="ml-auto h-full bg-[#ef4444]"
                        style={{ width }}
                      />
                    ) : null}
                  </div>
                  <div className="w-1/2">
                    {isPositive ? (
                      <div className="h-full bg-[#10b981]" style={{ width }} />
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-[#f9fafb]">
                  {strengthLabel(correlation)}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#9ca3af]">
                  {correlation.insight}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 px-4 py-8 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/15 text-[#6366f1]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="mt-4 text-lg font-semibold text-[#f9fafb]">
              Not enough data yet
            </p>
            <p className="mt-2 text-sm text-[#6b7280]">
              Log at least 14 days to unlock correlations
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
