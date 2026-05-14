"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserStore } from "@/store/userStore";

export function NavigationWrapper() {
  const { isLoading, user } = useUserStore();

  if (isLoading) {
    return null;
  }

  if (user === null) {
    return null;
  }

  return (
    <>
      <Sidebar />
      <BottomNav />
    </>
  );
}
