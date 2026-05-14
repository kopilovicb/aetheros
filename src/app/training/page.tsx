"use client";

import { useState } from "react";

import { TrainingAnalysis } from "@/components/cards/TrainingAnalysis";
import { WorkoutHistory } from "@/components/cards/WorkoutHistory";
import { WorkoutForm } from "@/components/forms/WorkoutForm";

type TrainingView = "log" | "history";

function ViewToggle({
  activeView,
  onChange,
}: {
  activeView: TrainingView;
  onChange: (view: TrainingView) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1">
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "log"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("log")}
      >
        Log Workout
      </button>
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "history"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("history")}
      >
        History
      </button>
    </div>
  );
}

export default function TrainingPage() {
  const [activeView, setActiveView] = useState<TrainingView>("log");

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <ViewToggle activeView={activeView} onChange={setActiveView} />
        {activeView === "log" ? (
          <WorkoutForm />
        ) : (
          <div className="space-y-5">
            <TrainingAnalysis />
            <WorkoutHistory />
          </div>
        )}
      </div>
    </main>
  );
}
