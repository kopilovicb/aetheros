"use client";

import { useState } from "react";

import { SupplementChecklist } from "@/components/cards/SupplementChecklist";
import { SupplementLibrary } from "@/components/cards/SupplementLibrary";

type SupplementsView = "today" | "library";

function ViewToggle({
  activeView,
  onChange,
}: {
  activeView: SupplementsView;
  onChange: (view: SupplementsView) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-1">
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "today"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("today")}
      >
        Today
      </button>
      <button
        className={`rounded-md px-4 py-2 text-sm ${
          activeView === "library"
            ? "bg-[#6366f1] font-medium text-white"
            : "text-[#9ca3af]"
        }`}
        type="button"
        onClick={() => onChange("library")}
      >
        Library
      </button>
    </div>
  );
}

export default function SupplementsPage() {
  const [activeView, setActiveView] = useState<SupplementsView>("today");

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <ViewToggle activeView={activeView} onChange={setActiveView} />
        {activeView === "today" ? (
          <SupplementChecklist />
        ) : (
          <SupplementLibrary />
        )}
      </div>
    </main>
  );
}
