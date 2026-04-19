"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-neutral-900 px-4 py-2 text-xs font-medium text-white">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      You&apos;re offline — changes will sync when you reconnect
    </div>
  );
}
