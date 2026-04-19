import type { Prospect } from "@/types";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

const NOTIFIED_KEY = "of_notified_today";

export function checkAndNotify(prospects: Prospect[]): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const notifiedIds: string[] = JSON.parse(sessionStorage.getItem(NOTIFIED_KEY) ?? "[]");

  const due = prospects.filter(
    (p) => p.nextFollowUpAt && p.nextFollowUpAt <= today && !notifiedIds.includes(p.id),
  );

  if (due.length === 0) return;

  if (due.length > 3) {
    try {
      new Notification("OutreachFlow — follow-ups due", {
        body: `${due.length} prospects need follow-up today.`,
        icon: "/icon-192.png",
        tag: "of-batch-followup",
      });
    } catch { /* iOS Safari: notification available but restricted until PWA installed */ }
  } else {
    for (const prospect of due) {
      try {
        new Notification(`Follow up: @${prospect.instagramHandle}`, {
          body: prospect.fullName
            ? `Time to follow up with ${prospect.fullName}`
            : "Time to send your follow-up DM.",
          icon: "/icon-192.png",
          tag: `of-followup-${prospect.id}`,
        });
      } catch { /* Silently ignore */ }
    }
  }

  const allNotified = [...new Set([...notifiedIds, ...due.map((p) => p.id)])];
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(allNotified));
}
