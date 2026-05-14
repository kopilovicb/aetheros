const scheduledTimeouts: number[] = [];

export async function requestPermission(): Promise<
  "granted" | "denied" | "default"
> {
  if (typeof window === "undefined" || !isSupported()) {
    return "denied";
  }

  return Notification.requestPermission();
}

export function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function isPermitted(): boolean {
  if (typeof window === "undefined" || !isSupported()) {
    return false;
  }

  return Notification.permission === "granted";
}

export function scheduleNotification(
  title: string,
  body: string,
  delayMs: number,
): void {
  if (typeof window === "undefined" || delayMs < 0) {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    showNotification(title, body);
  }, delayMs);
  scheduledTimeouts.push(timeoutId);
}

export function cancelAllNotifications(): void {
  if (typeof window === "undefined") {
    return;
  }

  scheduledTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
  scheduledTimeouts.length = 0;
}

export function showNotification(
  title: string,
  body: string,
  options?: NotificationOptions,
): void {
  if (typeof window === "undefined" || !isPermitted()) {
    return;
  }

  new Notification(title, {
    body,
    ...options,
  });
}
