"use client";

import { useCallback, useEffect, useState } from "react";

import { db } from "@/lib/db/schema";
import {
  isPermitted as checkIsPermitted,
  isSupported as checkIsSupported,
  requestPermission as requestNotificationPermission,
} from "@/lib/notifications/pushNotifications";
import {
  type NotificationPrefs,
  scheduleDailyNotifications,
} from "@/lib/notifications/scheduler";

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
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_PREFS;
  }

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

export function useNotifications(): {
  isSupported: boolean;
  isPermitted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  scheduleToday: () => void;
} {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermitted, setIsPermitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsSupported(checkIsSupported());
      setIsPermitted(checkIsPermitted());
      setIsLoading(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    await requestNotificationPermission();
    setIsSupported(checkIsSupported());
    setIsPermitted(checkIsPermitted());
    setIsLoading(false);
  }, []);

  const scheduleToday = useCallback((): void => {
    void (async () => {
      const prefs = readNotificationPrefs();
      const hasLoggedToday =
        (await db.recoveryLogs.where("date").equals(getTodayDate()).count()) >
        0;

      scheduleDailyNotifications(prefs, hasLoggedToday);
    })();
  }, []);

  return {
    isSupported,
    isPermitted,
    isLoading,
    requestPermission,
    scheduleToday,
  };
}
