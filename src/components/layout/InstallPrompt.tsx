"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const dismissed =
      localStorage.getItem("aetheros_install_dismissed") === "true";
    const visitCount =
      Number(localStorage.getItem("aetheros_visit_count") ?? "0") + 1;
    localStorage.setItem("aetheros_visit_count", String(visitCount));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (dismissed || visitCount < 3 || window.innerWidth >= 768) {
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShouldShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    setDeferredPrompt(null);
    setShouldShow(false);
  };

  const dismissPrompt = () => {
    localStorage.setItem("aetheros_install_dismissed", "true");
    setDeferredPrompt(null);
    setShouldShow(false);
  };

  if (!shouldShow || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-[#f9fafb] shadow-2xl md:hidden">
      <div className="mx-auto flex max-w-[680px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Install AetherOS</p>
          <p className="text-xs text-[#9ca3af]">Get the full app experience</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white"
            type="button"
            onClick={() => void installApp()}
          >
            Install
          </button>
          <button
            aria-label="Dismiss install prompt"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2a2a2a] text-[#9ca3af]"
            type="button"
            onClick={dismissPrompt}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
