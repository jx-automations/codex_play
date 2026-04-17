"use client";

import { useEffect } from "react";

/**
 * Registers the service worker and handles the beforeinstallprompt event.
 * Mount this component once in the app layout.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available — could show a "Refresh for updates" banner here
            }
          });
        });
      })
      .catch(() => {
        // Service worker registration failed (e.g., localhost HTTP without --experimental-https)
        // Silently ignore — app works without SW in dev
      });
  }, []);

  return null;
}
