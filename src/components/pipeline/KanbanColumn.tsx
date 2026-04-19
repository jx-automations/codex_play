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
      className="flex w-64 shrink-0 flex-col rounded-xl bg-neutral-50 snap-start"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
        style={{ borderTop: `3px solid ${accent}` }}
      >
        <span className="text-xs font-semibold text-neutral-700">{PIPELINE_STAGE_LABELS[stage]}</span>
        <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-medium text-neutral-500">
          {prospects.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2 transition-colors duration-150 ${
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
