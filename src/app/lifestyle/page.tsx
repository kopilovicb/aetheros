"use client";

import { useState } from "react";

import { LifestyleTrends } from "@/components/cards/LifestyleTrends";
import { LifestyleForm } from "@/components/forms/LifestyleForm";

type LifestyleView = "log" | "trends";

function ViewToggle({
  activeView,
  onChange,
}: {
  activeView: LifestyleView;
  onChange: (view: LifestyleView) => void;
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
          activeView === "trends"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("trends")}
      >
        Trends
      </button>
    </div>
  );
}

export default function LifestylePage() {
  const [activeView, setActiveView] = useState<LifestyleView>("log");

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <ViewToggle activeView={activeView} onChange={setActiveView} />
        {activeView === "log" ? <LifestyleForm /> : <LifestyleTrends />}
      </div>
    </main>
  );
}
