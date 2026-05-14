"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { db } from "@/lib/db/schema";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      const profiles = await db.userProfiles.toArray();
      const hasCompletedOnboarding = profiles.some(
        (profile) => profile.onboardingComplete,
      );

      router.replace(hasCompletedOnboarding ? "/dashboard" : "/onboarding");
    };

    void checkOnboarding();
  }, [router]);

  return null;
}
