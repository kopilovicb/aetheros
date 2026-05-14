"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useQuickLog } from "@/hooks/useQuickLog";

export function QuickLogWidget() {
  const { hasLoggedToday, isLoading, todaysLog } = useQuickLog();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-5 text-sm text-[#9ca3af]">
        Checking today&apos;s recovery log...
      </div>
    );
  }

  if (!hasLoggedToday) {
    return (
      <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-6 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6366f1]/15 text-[#6366f1]">
            <ClipboardList className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[#f9fafb]">
            Start your day with a check-in
          </p>
          <p className="mt-2 text-sm text-[#6b7280]">
            Capture recovery, energy, sleep, and HRV in under a minute.
          </p>
          <Button
            asChild
            className="mt-5 w-full bg-[#6366f1] text-white hover:bg-[#5558df] sm:w-auto"
          >
            <Link href="/recovery">Log Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  const loggedTime = todaysLog
    ? new Date(todaysLog.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="rounded-lg border border-[#10b981]/40 bg-[#1a1a1a] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] text-sm font-bold text-[#0a0a0a]">
          ✓
        </span>
        <div>
          <p className="font-semibold text-[#f9fafb]">
            Today&apos;s check-in complete
          </p>
          <p className="text-sm text-[#9ca3af]">
            {loggedTime ? `Logged at ${loggedTime}` : "Logged today"}
          </p>
        </div>
      </div>
    </div>
  );
}
