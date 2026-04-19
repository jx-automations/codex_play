import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Analytics" subtitle="Metrics and conversion trends." />
      <AnalyticsDashboard />
    </div>
  );
}
