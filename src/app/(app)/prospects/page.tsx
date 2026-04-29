import { PageHeader } from "@/components/layout/PageHeader";
import { ProspectList } from "@/components/prospects/ProspectList";

export const metadata = { title: "Prospects" };

export default function ProspectsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Prospects" subtitle="Search and filter your pipeline." />
      <ProspectList />
    </div>
  );
}
