"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { KanbanCard } from "@/components/pipeline/KanbanCard";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import { useAuth } from "@/context/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import { writeProspect } from "@/lib/firestore";
import { useProspects } from "@/hooks/useProspects";
import { PIPELINE_STAGES, type PipelineStage, type Prospect } from "@/types";

export function KanbanBoard() {
  const { prospects, loading } = useProspects();
  const { user } = useAuth();
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveProspect(prospects.find((p) => p.id === active.id) ?? null);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveProspect(null);
    if (!over || !user) return;

    const prospect = prospects.find((p) => p.id === active.id);
    if (!prospect) return;

    const newStage = (
      PIPELINE_STAGES.includes(over.id as PipelineStage)
        ? over.id
        : prospects.find((p) => p.id === over.id)?.pipelineStage
    ) as PipelineStage | undefined;

    if (!newStage || newStage === prospect.pipelineStage) return;

    const db = getFirebaseDb();
    if (!db) return;
    await writeProspect(db, user.uid, { ...prospect, pipelineStage: newStage, updatedAt: new Date() });
  }

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-4 pb-6 pt-2">
        {PIPELINE_STAGES.slice(0, 5).map((s) => (
          <div key={s} className="h-48 w-[260px] shrink-0 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const byStage = Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s, prospects.filter((p) => p.pipelineStage === s)]),
  ) as Record<PipelineStage, Prospect[]>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-3 overflow-x-auto pb-6 pt-2 no-scrollbar"
        style={{ padding: "8px 16px 16px", scrollSnapType: "x mandatory" }}
      >
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} prospects={byStage[stage]} />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeProspect ? <KanbanCard prospect={activeProspect} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
