"use client";

import { useState } from "react";

import { NutritionAnalysis } from "@/components/cards/NutritionAnalysis";
import { NutritionForm } from "@/components/forms/NutritionForm";

type NutritionView = "log" | "analysis";

function ViewToggle({
  activeView,
  onChange,
}: {
  activeView: NutritionView;
  onChange: (view: NutritionView) => void;
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
        Log
      </button>
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "analysis"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("analysis")}
      >
        Analysis
      </button>
    </div>
  );
}

export default function NutritionPage() {
  const [activeView, setActiveView] = useState<NutritionView>("log");

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <ViewToggle activeView={activeView} onChange={setActiveView} />
        {activeView === "log" ? <NutritionForm /> : <NutritionAnalysis />}
      </div>
    </main>
  );
}
