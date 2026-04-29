"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { KanbanCard } from "@/components/pipeline/KanbanCard";
import { PIPELINE_STAGE_LABELS, STAGE_ACCENTS, type PipelineStage, type Prospect } from "@/types";

interface KanbanColumnProps {
  stage: PipelineStage;
  prospects: Prospect[];
}

export function KanbanColumn({ stage, prospects }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const accent = STAGE_ACCENTS[stage];

  return (
    <div
      className="shrink-0 flex flex-col rounded-2xl bg-neutral-50"
      style={{ width: 260, minWidth: 260, scrollSnapAlign: "start" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-2xl px-3 py-3"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <span className="font-heading text-xs font-semibold text-neutral-700">
          {PIPELINE_STAGE_LABELS[stage]}
        </span>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-500">
          {prospects.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2 transition-colors duration-150 rounded-b-2xl ${
          isOver ? "bg-primary-light" : ""
        }`}
        style={{ minHeight: 120 }}
      >
        <SortableContext items={prospects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {prospects.map((p) => (
            <KanbanCard key={p.id} prospect={p} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
