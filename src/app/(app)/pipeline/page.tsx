import { PageHeader } from "@/components/layout/PageHeader";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";

export const metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Pipeline" subtitle="Drag cards to move prospects between stages." />
      <KanbanBoard />
    </div>
  );
}
