"use client";

import Link from "next/link";

import { StageBadge } from "@/components/ui/StageBadge";
import { type Prospect } from "@/types";

interface TodayProspectCardProps {
  prospect: Prospect;
  urgencyText?: string;
  urgencyLevel?: "danger" | "warning" | "success";
}

const urgencyColors = {
  danger:  "text-danger",
  warning: "text-warning",
  success: "text-success",
};

export function TodayProspectCard({ prospect, urgencyText, urgencyLevel = "warning" }: TodayProspectCardProps) {
  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition-colors duration-150 hover:border-neutral-200 active:bg-neutral-50"
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

      {/* Right side */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StageBadge stage={prospect.pipelineStage} />
        {urgencyText && (
          <span className={`text-xs font-medium ${urgencyColors[urgencyLevel]}`}>
            {urgencyText}
          </span>
        )}
      </div>
    </Link>
  );
}
