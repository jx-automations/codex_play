import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { TodayView } from "@/components/today/TodayView";

export const metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Today" subtitle="Work the hottest leads first." />
      <Suspense fallback={
        <div className="space-y-3 p-4">
          {[1, 2, 3].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-neutral-100" />)}
        </div>
      }>
        <TodayView />
      </Suspense>
    </div>
  );
}
