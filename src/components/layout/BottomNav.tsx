"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Home, Settings, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/recovery", label: "Recovery", icon: Activity },
  { href: "/training", label: "Training", icon: Dumbbell },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2a2a2a] bg-[#111111] md:hidden">
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/");
          const Icon = item.icon;

          return (
            <Link
              className={`flex min-h-11 flex-col items-center justify-center gap-1 px-1 py-2 text-xs ${
                isActive ? "text-[#6366f1]" : "text-[#6b7280]"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
