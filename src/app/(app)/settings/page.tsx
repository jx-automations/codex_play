import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Settings" />
      <SettingsPanel />
    </div>
  );
}
