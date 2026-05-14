import { db, type SyncQueueItem } from "@/lib/db/schema";

type SyncOperation = "insert" | "update" | "delete";

export type { SyncQueueItem };

export async function addToSyncQueue(
  tableName: string,
  operation: SyncOperation,
  payload: Record<string, unknown>,
): Promise<void> {
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    tableName,
    operation,
    payload,
    timestamp: Date.now(),
  });
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.orderBy("timestamp").toArray();
}

export async function removeSyncItem(id: string): Promise<void> {
  await db.syncQueue.delete(id);
}
