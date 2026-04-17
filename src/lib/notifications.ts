import type { Prospect } from "./outreach";
import { todayString } from "./outreach";

/** Returns true if the browser supports the Notifications API. */
export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Current permission status, or "unsupported" on non-supporting browsers. */
export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Request permission to show notifications.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

const NOTIFIED_KEY = "of_notified_today";

/**
 * Show browser notifications for any prospect whose follow-up date is today
 * or overdue, and that hasn't already been notified in this session.
 */
export function checkAndNotify(prospects: Prospect[]): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;

  const today = todayString();
  const notifiedIds: string[] = JSON.parse(
    sessionStorage.getItem(NOTIFIED_KEY) ?? "[]"
  );

  const due = prospects.filter(
    (p) => p.nextActionDate && p.nextActionDate <= today && !notifiedIds.includes(p.id)
  );

  if (due.length === 0) return;

  // Batch: show one summary notification if more than 3 due
  if (due.length > 3) {
    try {
      new Notification("OutreachFlow — follow-ups due", {
        body: `${due.length} prospects need follow-up today.`,
        icon: "/icon-192.png",
        tag: "of-batch-followup",

      });
    } catch {
      // Silently ignore — e.g., on iOS Safari where Notification is available
      // but showNotification isn't until installed to home screen
    }
  } else {
    for (const prospect of due) {
      try {
        new Notification(`Follow up: ${prospect.handle}`, {
          body: prospect.fullName
            ? `Time to follow up with ${prospect.fullName}`
            : `Time to follow up — currently in "${prospect.currentStage}"`,
          icon: "/icon-192.png",
          tag: `of-followup-${prospect.id}`,
  
        });
      } catch {
        // Silently ignore
      }
    }
  }

  // Mark all as notified for this session
  const allNotified = [...new Set([...notifiedIds, ...due.map((p) => p.id)])];
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(allNotified));
}
