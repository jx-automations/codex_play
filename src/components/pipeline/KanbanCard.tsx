"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { type Prospect } from "@/types";

interface KanbanCardProps {
  prospect: Prospect;
}

function daysSince(date: Date | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

export function KanbanCard({ prospect }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-neutral-100 bg-white shadow-sm"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-center rounded-t-xl py-1.5 touch-none active:cursor-grabbing"
        aria-label="Drag to move"
      >
        <div className="h-1 w-8 rounded-full bg-neutral-200" />
      </div>

      {/* Card body — tap goes to detail */}
      <Link
        href={`/prospects/${prospect.id}`}
        className="block px-3 pb-3"
        onClick={(e) => isDragging && e.preventDefault()}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
            {prospect.instagramHandle.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">@{prospect.instagramHandle}</p>
            {prospect.fullName && (
              <p className="truncate text-xs text-neutral-500">{prospect.fullName}</p>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
          {prospect.lastContactedAt && (
            <span>{daysSince(prospect.lastContactedAt)}d since contact</span>
          )}
          {prospect.nextFollowUpAt && prospect.nextFollowUpAt < new Date() && (
            <span className="text-danger font-medium">overdue</span>
          )}
        </div>
      </Link>
    </div>
  );
}
