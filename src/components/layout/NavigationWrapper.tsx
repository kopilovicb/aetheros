"use client";

import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserStore } from "@/store/userStore";

type NavigationWrapperProps = {
  children: ReactNode;
};

export function NavigationWrapper({ children }: NavigationWrapperProps) {
  const { user } = useUserStore();

  if (!user) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <>
      <Sidebar />
      <BottomNav />
      <div className="min-h-screen pb-20 md:ml-60 md:pb-0">{children}</div>
    </>
  );
}
