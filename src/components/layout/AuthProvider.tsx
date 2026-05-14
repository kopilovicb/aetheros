"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import { isPermitted } from "@/lib/notifications/pushNotifications";
import {
  type NotificationPrefs,
  scheduleDailyNotifications,
} from "@/lib/notifications/scheduler";
import { startBackgroundSync, stopBackgroundSync } from "@/lib/sync/engine";
import { getSession } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

type AuthProviderProps = {
  children: ReactNode;
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  morningEnabled: false,
  morningTime: "08:00",
  eveningEnabled: false,
  eveningTime: "21:00",
  weeklyEnabled: false,
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function readNotificationPrefs(): NotificationPrefs {
  const raw = localStorage.getItem("aetheros_notification_prefs");

  if (!raw) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_NOTIFICATION_PREFS;
    }

    const prefs = parsed as Record<string, unknown>;

    return {
      morningEnabled:
        typeof prefs.morningEnabled === "boolean"
          ? prefs.morningEnabled
          : typeof prefs.notificationsEnabled === "boolean"
            ? prefs.notificationsEnabled
            : DEFAULT_NOTIFICATION_PREFS.morningEnabled,
      morningTime:
        typeof prefs.morningTime === "string"
          ? prefs.morningTime
          : DEFAULT_NOTIFICATION_PREFS.morningTime,
      eveningEnabled:
        typeof prefs.eveningEnabled === "boolean"
          ? prefs.eveningEnabled
          : DEFAULT_NOTIFICATION_PREFS.eveningEnabled,
      eveningTime:
        typeof prefs.eveningTime === "string"
          ? prefs.eveningTime
          : DEFAULT_NOTIFICATION_PREFS.eveningTime,
      weeklyEnabled:
        typeof prefs.weeklyEnabled === "boolean"
          ? prefs.weeklyEnabled
          : typeof prefs.weeklySummaryEnabled === "boolean"
            ? prefs.weeklySummaryEnabled
            : DEFAULT_NOTIFICATION_PREFS.weeklyEnabled,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

async function schedulePermittedNotifications(): Promise<void> {
  if (!isPermitted()) {
    return;
  }

  const prefs = readNotificationPrefs();
  const hasLoggedToday =
    (await db.recoveryLogs.where("date").equals(getTodayDate()).count()) > 0;

  scheduleDailyNotifications(prefs, hasLoggedToday);
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const { setUser, setSession, setIsLoading } = useUserStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      setIsLoading(true);
      const { data, error } = await getSession();

      if (isMounted && !error) {
        setSession(data);
        setUser(data?.user ?? null);

        if (data) {
          startBackgroundSync();
          void schedulePermittedNotifications();
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session) {
        startBackgroundSync();
        void schedulePermittedNotifications();
      } else {
        stopBackgroundSync();
      }
    });

    return () => {
      isMounted = false;
      stopBackgroundSync();
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession, setUser]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
