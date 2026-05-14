"use client";

import { useTrendsData } from "@/hooks/useTrendsData";

function getCellColor(day: {
  recoveryLogged: boolean;
  workoutLogged: boolean;
  nutritionLogged: boolean;
}): string {
  if (day.recoveryLogged && day.workoutLogged && day.nutritionLogged) {
    return "#6366f1";
  }

  if (day.recoveryLogged && day.workoutLogged) {
    return "rgba(99, 102, 241, 0.7)";
  }

  if (day.recoveryLogged) {
    return "rgba(99, 102, 241, 0.4)";
  }

  return "#1a1a1a";
}

function calculateCurrentStreak(days: { recoveryLogged: boolean }[]): number {
  let streak = 0;

  for (const day of [...days].reverse()) {
    if (!day.recoveryLogged) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function ConsistencyHeatmap() {
  const { heatmapData, isLoading } = useTrendsData();
  const weeks = Array.from({ length: 12 }).map((_, weekIndex) =>
    heatmapData.slice(weekIndex * 7, weekIndex * 7 + 7),
  );
  const monthConsistency =
    heatmapData.slice(-30).filter((day) => day.recoveryLogged).length / 30;

  if (isLoading) {
    return (
      <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Loading consistency...
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-xl font-semibold text-[#f9fafb]">
        Logging Consistency
      </h2>
      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[420px] grid-cols-[24px_repeat(12,1fr)] gap-1">
          <div />
          {weeks.map((week) => (
            <p className="text-center text-[10px] text-[#6b7280]" key={week[0]?.date}>
              {week[0]
                ? new Date(`${week[0].date}T00:00:00`).toLocaleDateString("en-US", {
                    month: "short",
                  })
                : ""}
            </p>
          ))}
          {["M", "T", "W", "T", "F", "S", "S"].map((label, rowIndex) => (
            <>
              <p className="text-xs text-[#6b7280]" key={`label-${rowIndex}`}>
                {label}
              </p>
              {weeks.map((week) => {
                const day = week[rowIndex];
                return (
                  <div
                    className="h-5 rounded border border-[#2a2a2a]"
                    key={`${day?.date}-${rowIndex}`}
                    style={{ backgroundColor: day ? getCellColor(day) : "#1a1a1a" }}
                    title={
                      day
                        ? `${day.date}: ${[
                            day.recoveryLogged ? "recovery" : "",
                            day.workoutLogged ? "workout" : "",
                            day.nutritionLogged ? "nutrition" : "",
                          ]
                            .filter(Boolean)
                            .join(", ") || "no log"}`
                        : ""
                    }
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-[#9ca3af]">
        {calculateCurrentStreak(heatmapData)} day streak ·{" "}
        {Math.round(monthConsistency * 100)}% consistency this month
      </p>
    </section>
  );
}
