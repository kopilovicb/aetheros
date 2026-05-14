"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db/schema";
import { exportCSV, exportJSON, importJSON } from "@/lib/export/exportData";
import { showNotification } from "@/lib/notifications/pushNotifications";
import { addToSyncQueue } from "@/lib/sync/queue";
import { signOut } from "@/lib/supabase/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserStore } from "@/store/userStore";
import type { UserProfile } from "@/types/models";

const PRIMARY_GOALS = [
  "Recovery optimization",
  "Training performance",
  "Sleep improvement",
  "General wellness",
] as const;

type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

interface NotificationPreferences {
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  weeklyEnabled: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  morningEnabled: false,
  morningTime: "08:00",
  eveningEnabled: false,
  eveningTime: "21:00",
  weeklyEnabled: false,
};

function getPreferenceText(
  profile: UserProfile | null,
  key: string,
  fallback: string,
): string {
  const value = profile?.preferences[key];

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function readNotificationPreferences(): NotificationPreferences {
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

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border-t border-[#2a2a2a] py-6 first:border-t-0 first:pt-0">
      <h2 className="mb-4 text-lg font-semibold text-[#f9fafb]">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const {
    isLoading: notificationsLoading,
    isPermitted: notificationsPermitted,
    isSupported: notificationsSupported,
    requestPermission,
    scheduleToday,
  } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(PRIMARY_GOALS[0]);
  const [recoveryLogCount, setRecoveryLogCount] = useState(0);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFS);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(
    null,
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings(): Promise<void> {
      const profiles = await db.userProfiles.toArray();
      const currentProfile =
        profiles.find((candidate) => candidate.id === user?.id) ??
        profiles[0] ??
        null;
      const logCount = currentProfile
        ? await db.recoveryLogs
            .where("userId")
            .equals(currentProfile.id)
            .count()
        : 0;

      if (!isMounted) {
        return;
      }

      setProfile(currentProfile);
      setName(currentProfile?.name ?? "");
      setAge(getPreferenceText(currentProfile, "age", ""));
      setPrimaryGoal(
        PRIMARY_GOALS.includes(
          getPreferenceText(currentProfile, "primaryGoal", PRIMARY_GOALS[0]) as PrimaryGoal,
        )
          ? (getPreferenceText(
              currentProfile,
              "primaryGoal",
              PRIMARY_GOALS[0],
            ) as PrimaryGoal)
          : PRIMARY_GOALS[0],
      );
      setRecoveryLogCount(logCount);
      setNotificationPrefs(readNotificationPreferences());
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const saveProfile = async () => {
    const profileId = profile?.id ?? user?.id ?? crypto.randomUUID();
    const updatedProfile: UserProfile = {
      id: profileId,
      name: name.trim(),
      baselinePeriodComplete: profile?.baselinePeriodComplete ?? false,
      onboardingComplete: profile?.onboardingComplete ?? true,
      preferences: {
        ...profile?.preferences,
        age: age ? Number(age) : null,
        primaryGoal,
      },
    };

    await db.userProfiles.put(updatedProfile);
    await addToSyncQueue("user_profiles", "update", { ...updatedProfile });
    setProfile(updatedProfile);
    setProfileStatus("Profile saved.");
  };

  const saveNotificationPreferences = () => {
    localStorage.setItem(
      "aetheros_notification_prefs",
      JSON.stringify(notificationPrefs),
    );
    scheduleToday();
    setNotificationStatus("Preferences saved.");
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setImportStatus(null);
    setImportError(null);

    const result = await importJSON(file);

    if (result.success) {
      setImportStatus(result.summary);
      return;
    }

    setImportStatus(result.summary);
    setImportError(result.error ?? null);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const clearLocalData = async () => {
    const confirmed = window.confirm(
      "This will delete all local data. Cloud data will remain. Are you sure?",
    );

    if (!confirmed) {
      return;
    }

    await db.delete();
    await db.open();
    router.push("/onboarding");
  };

  return (
    <main className="min-h-screen overflow-y-auto bg-[#0a0a0a] px-4 py-6 text-[#f9fafb]">
      <div className="mx-auto w-full max-w-[680px]">
        <h1 className="mb-6 text-3xl font-semibold">Settings</h1>

        <div className="space-y-0">
          <Section title="Profile">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb]"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb]"
                  min={0}
                  type="number"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-goal">Primary goal</Label>
                <select
                  id="primary-goal"
                  className="h-10 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 text-sm text-[#f9fafb] outline-none focus:ring-2 focus:ring-[#6366f1]"
                  value={primaryGoal}
                  onChange={(event) =>
                    setPrimaryGoal(event.target.value as PrimaryGoal)
                  }
                >
                  {PRIMARY_GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="bg-[#6366f1] text-white hover:bg-[#5558df]"
                type="button"
                onClick={() => void saveProfile()}
              >
                Save Profile
              </Button>

              {profileStatus ? (
                <p className="text-sm text-[#10b981]">{profileStatus}</p>
              ) : null}

              <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-sm text-[#9ca3af]">
                {profile?.baselinePeriodComplete ? (
                  <p className="text-[#10b981]">✓ Personal baseline established</p>
                ) : (
                  <p>
                    Baseline building in progress — {recoveryLogCount} days of
                    data collected
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section title="Notifications">
            <div className="space-y-4">
              <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                {!notificationsSupported ? (
                  <p className="text-sm text-[#f59e0b]">
                    Notifications are not supported in this browser
                  </p>
                ) : notificationsPermitted ? (
                  <p className="text-sm text-[#10b981]">
                    ✓ Notifications enabled
                  </p>
                ) : typeof window !== "undefined" &&
                  "Notification" in window &&
                  Notification.permission === "denied" ? (
                  <p className="text-sm text-[#f59e0b]">
                    Notifications blocked — please enable in browser settings
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#9ca3af]">
                      Notifications not enabled
                    </p>
                    <Button
                      className="bg-[#6366f1] text-white hover:bg-[#5558df]"
                      disabled={notificationsLoading}
                      type="button"
                      onClick={() => void requestPermission()}
                    >
                      Enable Notifications
                    </Button>
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between gap-4 text-sm text-[#f9fafb]">
                <span>Enable morning reminder</span>
                <input
                  checked={notificationPrefs.morningEnabled}
                  className="h-5 w-5 accent-[#6366f1]"
                  type="checkbox"
                  onChange={(event) =>
                    setNotificationPrefs((prefs) => ({
                      ...prefs,
                      morningEnabled: event.target.checked,
                    }))
                  }
                />
              </label>

              <div className="space-y-2">
                <Label htmlFor="morning-time">Morning reminder time</Label>
                <Input
                  id="morning-time"
                  className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb]"
                  type="time"
                  value={notificationPrefs.morningTime}
                  onChange={(event) =>
                    setNotificationPrefs((prefs) => ({
                      ...prefs,
                      morningTime: event.target.value,
                    }))
                  }
                />
              </div>

              <label className="flex items-center justify-between gap-4 text-sm text-[#f9fafb]">
                <span>Enable evening reminder</span>
                <input
                  checked={notificationPrefs.eveningEnabled}
                  className="h-5 w-5 accent-[#6366f1]"
                  type="checkbox"
                  onChange={(event) =>
                    setNotificationPrefs((prefs) => ({
                      ...prefs,
                      eveningEnabled: event.target.checked,
                    }))
                  }
                />
              </label>

              <div className="space-y-2">
                <Label htmlFor="evening-time">Evening reminder time</Label>
                <Input
                  id="evening-time"
                  className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb]"
                  type="time"
                  value={notificationPrefs.eveningTime}
                  onChange={(event) =>
                    setNotificationPrefs((prefs) => ({
                      ...prefs,
                      eveningTime: event.target.value,
                    }))
                  }
                />
              </div>

              <label className="flex items-center justify-between gap-4 text-sm text-[#f9fafb]">
                <span>Enable weekly summary</span>
                <input
                  checked={notificationPrefs.weeklyEnabled}
                  className="h-5 w-5 accent-[#6366f1]"
                  type="checkbox"
                  onChange={(event) =>
                    setNotificationPrefs((prefs) => ({
                      ...prefs,
                      weeklyEnabled: event.target.checked,
                    }))
                  }
                />
              </label>

              <Button
                className="bg-[#6366f1] text-white hover:bg-[#5558df]"
                type="button"
                onClick={saveNotificationPreferences}
              >
                Save Preferences
              </Button>

              {notificationStatus ? (
                <p className="text-sm text-[#10b981]">{notificationStatus}</p>
              ) : null}

              {notificationsPermitted ? (
                <Button
                  className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb] hover:bg-[#1a1a1a]"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    showNotification(
                      "AetherOS Test",
                      "Notifications are working! ✓",
                    )
                  }
                >
                  Test Notification
                </Button>
              ) : null}

              <p className="text-sm text-[#6b7280]">
                Notification support requires app to be installed as PWA
              </p>
            </div>
          </Section>

          <Section title="Your Data">
            <div className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#f9fafb]">Export</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb] hover:bg-[#1a1a1a]"
                    type="button"
                    variant="outline"
                    onClick={() => void exportJSON()}
                  >
                    Export as JSON
                  </Button>
                  <Button
                    className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb] hover:bg-[#1a1a1a]"
                    type="button"
                    variant="outline"
                    onClick={() => void exportCSV()}
                  >
                    Export as CSV
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#f9fafb]">Import</h3>
                <input
                  ref={fileInputRef}
                  accept="application/json,.json"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    void handleImportFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button
                  className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb] hover:bg-[#1a1a1a]"
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import from JSON
                </Button>
                {importStatus ? (
                  <p className="text-sm text-[#10b981]">{importStatus}</p>
                ) : null}
                {importError ? (
                  <p className="text-sm text-[#ef4444]">{importError}</p>
                ) : null}
              </div>
            </div>
          </Section>

          <Section title="Account">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm text-[#6b7280]">Email</p>
                <p className="text-sm text-[#f9fafb]">
                  {user?.email ?? "Not signed in"}
                </p>
              </div>

              <Button
                className="border-[#2a2a2a] bg-[#111111] text-[#f9fafb] hover:bg-[#1a1a1a]"
                type="button"
                variant="outline"
                onClick={() => void handleSignOut()}
              >
                Sign Out
              </Button>

              <div className="rounded-lg border border-[#ef4444] bg-[#1a1a1a] p-4">
                <h3 className="text-sm font-semibold text-[#ef4444]">
                  Danger Zone
                </h3>
                <Button
                  className="mt-4 bg-[#ef4444] text-white hover:bg-[#dc2626]"
                  type="button"
                  onClick={() => void clearLocalData()}
                >
                  Clear All Local Data
                </Button>
              </div>
            </div>
          </Section>

          <Section title="About">
            <div className="space-y-3 text-sm text-[#6b7280]">
              <p>
                <span className="text-[#9ca3af]">AetherOS</span>
              </p>
              <p>Version: 1.0.0</p>
              <p>A free, local-first performance operating system.</p>
              <p>
                Your data is stored locally on this device and synced to your
                private Supabase instance. No data is shared with third parties.
              </p>
              <p>
                AetherOS is not a medical device. Insights are for informational
                purposes only. Consult a healthcare professional for medical
                advice.
              </p>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
