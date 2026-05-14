"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Brain,
  Dumbbell,
  Home,
  Moon,
  Salad,
  Settings,
  Sparkles,
  Tablets,
  TrendingUp,
} from "lucide-react";

import { signOut } from "@/lib/supabase/auth";
import { useUserStore } from "@/store/userStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/recovery", label: "Recovery", icon: Activity },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/supplements", label: "Supplements", icon: Tablets },
  { href: "/lifestyle", label: "Lifestyle", icon: Sparkles },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/insights", label: "Insights", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserStore();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#2a2a2a] bg-[#111111] md:flex">
      <div className="border-b border-[#2a2a2a] px-5 py-5">
        <p className="text-lg font-bold text-[#6366f1]">AetherOS</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/");
          const Icon = item.icon;

          return (
            <Link
              className={`flex min-h-11 items-center gap-3 rounded-full px-3 text-sm transition-colors ${
                isActive
                  ? "bg-[#6366f1]/15 text-[#6366f1]"
                  : "text-[#9ca3af] hover:bg-[#1a1a1a] hover:text-[#f9fafb]"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#2a2a2a] p-4">
        <p className="truncate text-xs text-[#6b7280]">
          {user?.email ?? "Not signed in"}
        </p>
        <button
          className="mt-3 min-h-11 w-full rounded-md border border-[#2a2a2a] px-3 text-sm text-[#9ca3af] transition-colors hover:bg-[#1a1a1a] hover:text-[#f9fafb]"
          type="button"
          onClick={() => void handleSignOut()}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
