"use client";

import { useEffect, useState } from "react";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getPendingItems } from "@/lib/sync/queue";

type SyncStatusEventDetail = {
  syncing: boolean;
};

const SYNC_STATUS_EVENT = "aetheros-sync-status";

export function SyncIndicator() {
  const { isOnline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const refreshPendingCount = async () => {
      const pendingItems = await getPendingItems();

      if (isMounted) {
        setPendingCount(pendingItems.length);
      }
    };

    const handleSyncStatus = (event: Event) => {
      const customEvent = event as CustomEvent<SyncStatusEventDetail>;
      setIsSyncing(customEvent.detail.syncing);
      void refreshPendingCount();
    };

    void refreshPendingCount();
    window.addEventListener(SYNC_STATUS_EVENT, handleSyncStatus);

    return () => {
      isMounted = false;
      window.removeEventListener(SYNC_STATUS_EVENT, handleSyncStatus);
    };
  }, []);

  const shouldShowText = !isOnline || isSyncing;
  const statusText = isOnline ? "Syncing..." : "Offline";
  const dotClassName = !isOnline
    ? "bg-[#f59e0b]"
    : isSyncing || pendingCount > 0
      ? "bg-[#6366f1]"
      : "bg-[#10b981]";

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-md bg-[#1a1a1a] px-2 py-1 text-xs text-[#9ca3af]">
      <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
      {shouldShowText ? <span>{statusText}</span> : null}
    </div>
  );
}
