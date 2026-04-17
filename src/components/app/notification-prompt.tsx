"use client";

import { useEffect, useState } from "react";
import {
  notificationsSupported,
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

const DISMISSED_KEY = "of_notif_prompt_dismissed";

/**
 * Shows a one-time banner asking the user to enable follow-up reminders.
 * Only shown when permission is "default" (not yet asked) and the user
 * hasn't dismissed it before.
 */
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notificationsSupported()) return;
    if (notificationPermission() !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setVisible(true);
  }, []);

  async function handleAllow() {
    setVisible(false);
    await requestNotificationPermission();
  }

  function handleLater() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(92vw, 400px)",
        background: "rgba(13, 24, 47, 0.97)",
        border: "1.5px solid rgba(249, 115, 22, 0.35)",
        borderRadius: "14px",
        padding: "14px 16px",
        zIndex: 60,
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "#ecf5ff",
            marginBottom: "4px",
            lineHeight: 1.3,
          }}
        >
          Enable follow-up reminders?
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#94a3b8",
            marginBottom: "10px",
            lineHeight: 1.4,
          }}
        >
          Get notified when a prospect is due for follow-up.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleAllow}
            style={{
              background: "#f97316",
              color: "#08111f",
              border: "none",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Allow
          </button>
          <button
            onClick={handleLater}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
