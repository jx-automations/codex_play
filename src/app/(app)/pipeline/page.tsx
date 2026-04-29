import { PageHeader } from "@/components/layout/PageHeader";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";

export const metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-neutral-50">
      <PageHeader title="Pipeline" subtitle="Drag to move between stages." />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
