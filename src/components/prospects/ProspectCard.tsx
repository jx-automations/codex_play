"use client";

import Link from "next/link";

import { StageBadge } from "@/components/ui/StageBadge";
import { type Prospect } from "@/types";

interface ProspectCardProps {
  prospect: Prospect;
}

function formatFollowUp(date: Date | null): string {
  if (!date) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
}

export function ProspectCard({ prospect }: ProspectCardProps) {
  const followUpText = formatFollowUp(prospect.nextFollowUpAt);
  const isOverdue = prospect.nextFollowUpAt && prospect.nextFollowUpAt < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-3.5 transition-colors duration-150 hover:bg-neutral-50 active:bg-neutral-100 mx-4 mb-2 rounded-2xl shadow-sm"
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
        {prospect.instagramHandle.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          @{prospect.instagramHandle}
        </p>
        {prospect.fullName && (
          <p className="truncate text-xs text-neutral-500">{prospect.fullName}</p>
        )}
      </div>

      {/* Right */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StageBadge stage={prospect.pipelineStage} />
        {followUpText && (
          <span className={`text-xs ${isOverdue ? "text-danger font-medium" : "text-neutral-400"}`}>
            {followUpText}
          </span>
        )}
      </div>
    </Link>
  );
}
