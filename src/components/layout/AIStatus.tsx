"use client";

import { useAI } from "@/hooks/useAI";

export function AIStatus() {
  const { isLoading, isReady } = useAI();

  if (isReady || !isLoading) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2 text-xs text-[#6b7280]">
      <span className="h-2 w-2 animate-spin rounded-full border border-[#6366f1] border-t-transparent" />
      <span>AI loading...</span>
    </div>
  );
}
