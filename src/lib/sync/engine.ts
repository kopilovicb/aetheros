import { getSession } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { getPendingItems, removeSyncItem } from "@/lib/sync/queue";

const SYNC_INTERVAL_MS = 30_000;
const SYNC_STATUS_EVENT = "aetheros-sync-status";

let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;
let isBackgroundSyncStarted = false;

function dispatchSyncStatus(syncing: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SYNC_STATUS_EVENT, {
      detail: { syncing },
    }),
  );
}

export async function processSyncQueue(): Promise<void> {
  if (isSyncing) {
    return;
  }

  const { data: session, error } = await getSession();

  if (error || !session) {
    return;
  }

  isSyncing = true;
  dispatchSyncStatus(true);

  try {
    const pendingItems = await getPendingItems();

    for (const item of pendingItems) {
      const itemId =
        typeof item.payload.id === "string" ? item.payload.id : null;

      if (!itemId) {
        continue;
      }

      const { error: syncError } =
        item.operation === "insert"
          ? await supabase.from(item.tableName).insert(item.payload)
          : item.operation === "update"
            ? await supabase
                .from(item.tableName)
                .update(item.payload)
                .eq("id", itemId)
            : await supabase.from(item.tableName).delete().eq("id", itemId);

      if (!syncError) {
        await removeSyncItem(item.id);
      }
    }
  } finally {
    isSyncing = false;
    dispatchSyncStatus(false);
  }
}

export function startBackgroundSync(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (isBackgroundSyncStarted) {
    return;
  }

  isBackgroundSyncStarted = true;
  void processSyncQueue();
  window.addEventListener("online", processSyncQueue);

  if (!syncIntervalId) {
    syncIntervalId = setInterval(() => {
      void processSyncQueue();
    }, SYNC_INTERVAL_MS);
  }
}

export function stopBackgroundSync(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.removeEventListener("online", processSyncQueue);
  isBackgroundSyncStarted = false;

  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
