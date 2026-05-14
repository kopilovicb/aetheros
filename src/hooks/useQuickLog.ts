"use client";

import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import type { RecoveryLog } from "@/types/models";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useQuickLog(): {
  hasLoggedToday: boolean;
  todaysLog: RecoveryLog | null;
  isLoading: boolean;
  submitLog: (
    log: Omit<RecoveryLog, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
} {
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [todaysLog, setTodaysLog] = useState<RecoveryLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const today = getTodayDate();

    void db.recoveryLogs
      .where("date")
      .equals(today)
      .first()
      .then((log) => {
        if (!isMounted) {
          return;
        }

        setTodaysLog(log ?? null);
        setHasLoggedToday(Boolean(log));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const submitLog = useCallback(
    async (
      log: Omit<RecoveryLog, "id" | "createdAt" | "updatedAt">,
    ): Promise<void> => {
      const now = new Date().toISOString();
      const recoveryLog: RecoveryLog = {
        ...log,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      await db.recoveryLogs.add(recoveryLog);
      await addToSyncQueue("recovery_logs", "insert", { ...recoveryLog });

      setTodaysLog(recoveryLog);
      setHasLoggedToday(true);
    },
    [],
  );

  return {
    hasLoggedToday,
    todaysLog,
    isLoading,
    submitLog,
  };
}
