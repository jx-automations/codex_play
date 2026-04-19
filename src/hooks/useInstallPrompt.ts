"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function promptInstall(): Promise<boolean> {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    return outcome === "accepted";
  }

  return { canInstall: !!promptEvent, promptInstall };
}
