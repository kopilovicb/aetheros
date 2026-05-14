import {
  cancelAllNotifications,
  scheduleNotification,
} from "@/lib/notifications/pushNotifications";

export interface NotificationPrefs {
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  weeklyEnabled: boolean;
}

export function getMsUntilTime(timeString: string): number {
  const [hoursText, minutesText] = timeString.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return -1;
  }

  const targetTime = new Date();
  targetTime.setHours(hours, minutes, 0, 0);

  const delayMs = targetTime.getTime() - Date.now();
  return delayMs < 0 ? -1 : delayMs;
}

export function scheduleDailyNotifications(
  prefs: NotificationPrefs,
  hasLoggedToday: boolean,
): void {
  cancelAllNotifications();

  if (prefs.morningEnabled) {
    const morningDelay = getMsUntilTime(prefs.morningTime);

    if (morningDelay >= 0) {
      scheduleNotification(
        "AetherOS",
        "Good morning! Time for your recovery check-in. 🌅",
        morningDelay,
      );
    }
  }

  if (prefs.eveningEnabled && !hasLoggedToday) {
    const eveningDelay = getMsUntilTime(prefs.eveningTime);

    if (eveningDelay >= 0) {
      scheduleNotification(
        "AetherOS",
        "Don't forget to log today's recovery data. 📊",
        eveningDelay,
      );
    }
  }

  if (prefs.weeklyEnabled && new Date().getDay() === 1) {
    const weeklyDelay = getMsUntilTime("09:00");

    if (weeklyDelay >= 0) {
      scheduleNotification(
        "AetherOS Weekly",
        "Your weekly recovery summary is ready. Check your trends! 📈",
        weeklyDelay,
      );
    }
  }
}
