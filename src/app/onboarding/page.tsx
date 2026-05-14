"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Step1Welcome } from "@/components/forms/onboarding/Step1Welcome";
import {
  Step2Profile,
  type ProfileData,
} from "@/components/forms/onboarding/Step2Profile";
import {
  Step3Supplements,
  type SupplementSetupData,
} from "@/components/forms/onboarding/Step3Supplements";
import {
  Step4Notifications,
  type NotificationPreferencesData,
} from "@/components/forms/onboarding/Step4Notifications";
import { Step5Baseline } from "@/components/forms/onboarding/Step5Baseline";
import {
  Step6FirstLog,
  type FirstLogData,
} from "@/components/forms/onboarding/Step6FirstLog";
import { db } from "@/lib/db/schema";
import { addToSyncQueue } from "@/lib/sync/queue";
import { useUserStore } from "@/store/userStore";
import type { RecoveryLog, SupplementEntry, SupplementLog } from "@/types/models";

const TOTAL_STEPS = 6;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    age: "",
    primaryGoal: "",
  });
  const [supplementData, setSupplementData] = useState<SupplementSetupData>({
    selectedSupplements: [],
  });
  const [notificationData, setNotificationData] =
    useState<NotificationPreferencesData>({
      morningTime: "08:00",
      eveningTime: "21:00",
      notificationsEnabled: true,
    });
  const [firstLogData, setFirstLogData] = useState<FirstLogData>({
    sleepScore: 70,
    sleepDuration: 7.5,
    hrv: 60,
    energyLevel: 5,
  });
  const [isSaving, setIsSaving] = useState(false);

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;
  const canContinue =
    currentStep !== 2 ||
    (profileData.firstName.trim() &&
      profileData.age.trim() &&
      profileData.primaryGoal);

  const goToNextStep = () => {
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const completeOnboarding = async () => {
    setIsSaving(true);

    try {
      const userId = user?.id ?? crypto.randomUUID();
      const now = new Date().toISOString();
      const today = getTodayDate();
      const recoveryLog: RecoveryLog = {
        id: crypto.randomUUID(),
        userId,
        date: today,
        sleepScore: firstLogData.sleepScore,
        sleepDuration: firstLogData.sleepDuration,
        hrv: firstLogData.hrv,
        bodyBattery: firstLogData.energyLevel * 10,
        stressLevel: 5,
        soreness: 0,
        energyLevel: firstLogData.energyLevel,
        notes: "",
        createdAt: now,
        updatedAt: now,
      };
      const supplements: SupplementEntry[] =
        supplementData.selectedSupplements.map((name) => ({
          name,
          dosage: "",
          timing: "",
          taken: true,
          purpose: "",
        }));
      const supplementLog: SupplementLog = {
        id: crypto.randomUUID(),
        userId,
        date: today,
        supplements,
      };

      await db.userProfiles.put({
        id: userId,
        name: profileData.firstName.trim(),
        baselinePeriodComplete: false,
        onboardingComplete: true,
        preferences: {
          age: Number(profileData.age),
          primaryGoal: profileData.primaryGoal,
        },
      });
      await db.supplementLogs.put(supplementLog);
      await db.recoveryLogs.add(recoveryLog);
      await addToSyncQueue("recovery_logs", "insert", { ...recoveryLog });

      localStorage.setItem(
        "aetheros_notification_prefs",
        JSON.stringify(notificationData),
      );

      router.push("/");
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return <Step1Welcome onComplete={goToNextStep} />;
    }

    if (currentStep === 2) {
      return <Step2Profile data={profileData} onComplete={setProfileData} />;
    }

    if (currentStep === 3) {
      return (
        <Step3Supplements
          data={supplementData}
          onComplete={setSupplementData}
        />
      );
    }

    if (currentStep === 4) {
      return (
        <Step4Notifications
          data={notificationData}
          onComplete={setNotificationData}
        />
      );
    }

    if (currentStep === 5) {
      return <Step5Baseline onComplete={goToNextStep} />;
    }

    return <Step6FirstLog data={firstLogData} onComplete={setFirstLogData} />;
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-[#f9fafb]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col">
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm text-[#9ca3af]">
            <span>
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className="h-full rounded-full bg-[#6366f1] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <section className="flex-1 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
          {renderStep()}
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            disabled={currentStep === 1 || isSaving}
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
          >
            Back
          </Button>
          <Button
            className="bg-[#6366f1] text-white hover:bg-[#5558df]"
            disabled={!canContinue || isSaving}
            type="button"
            onClick={currentStep === TOTAL_STEPS ? completeOnboarding : goToNextStep}
          >
            {currentStep === TOTAL_STEPS
              ? isSaving
                ? "Saving..."
                : "Complete Setup"
              : "Next"}
          </Button>
        </div>
      </div>
    </main>
  );
}
