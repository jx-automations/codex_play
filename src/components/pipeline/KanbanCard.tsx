"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { StageBadge } from "@/components/ui/StageBadge";
import { type Prospect } from "@/types";

interface KanbanCardProps {
  prospect: Prospect;
  isDragOverlay?: boolean;
}

function daysSince(date: Date | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export function KanbanCard({ prospect, isDragOverlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const initials = prospect.instagramHandle.slice(0, 2).toUpperCase();
  const daysSinceContact = daysSince(prospect.lastContactedAt);

  const card = (
    <div
      className={`rounded-xl border border-neutral-100 bg-white p-3 shadow-sm ${
        isDragOverlay ? "rotate-2 shadow-lg" : ""
      }`}
    >
      {/* Drag handle */}
      {!isDragOverlay && (
        <div
          {...attributes}
          {...listeners}
          className="mb-2 flex cursor-grab justify-center touch-none active:cursor-grabbing"
          aria-label="Drag to move"
        >
          <div className="h-1 w-8 rounded-full bg-neutral-200" />
        </div>
      )}

      {/* Avatar + name */}
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            @{prospect.instagramHandle}
          </p>
          {prospect.fullName && (
            <p className="truncate text-xs text-neutral-500">{prospect.fullName}</p>
          )}
        </div>
      </div>

      {/* Stage badge + days since contact */}
      <div className="mt-2.5 flex items-center justify-between">
        <StageBadge stage={prospect.pipelineStage} />
        {prospect.lastContactedAt && (
          <span className="text-xs text-neutral-400">{daysSinceContact}d ago</span>
        )}
      </div>
    </div>
  );

  if (isDragOverlay) return card;

  return (
    <div ref={setNodeRef} style={style}>
      <Link
        href={`/prospects/${prospect.id}`}
        onClick={(e) => isDragging && e.preventDefault()}
      >
        {card}
      </Link>
    </div>
  );
}
