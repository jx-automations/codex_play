import { Suspense } from "react";

import { TodayView } from "@/components/today/TodayView";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Suspense fallback={
        <div className="space-y-3 p-4 pt-6">
          {[1, 2, 3].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}
        </div>
      }>
        <TodayView />
      </Suspense>
    </div>
  );
}
