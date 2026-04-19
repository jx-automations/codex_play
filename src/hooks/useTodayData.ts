"use client";

import { useMemo } from "react";

import { useProspects } from "@/hooks/useProspects";
import { type Prospect } from "@/types";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function tomorrowStart() {
  const d = todayStart();
  d.setDate(d.getDate() + 1);
  return d;
}

export interface TodayData {
  overdue: Prospect[];
  dueToday: Prospect[];
  recentReplies: Prospect[];
  dmsSentToday: number;
}

export function useTodayData(): { data: TodayData; loading: boolean } {
  const { prospects, loading } = useProspects();

  const data = useMemo((): TodayData => {
    const today = todayStart();
    const tomorrow = tomorrowStart();
    const oneDayAgo = new Date(Date.now() - 86400000);

    const overdue = prospects
      .filter((p) => p.nextFollowUpAt && p.nextFollowUpAt < today)
      .sort((a, b) => (a.nextFollowUpAt?.getTime() ?? 0) - (b.nextFollowUpAt?.getTime() ?? 0));

    const dueToday = prospects.filter((p) => {
      if (!p.nextFollowUpAt) return false;
      return p.nextFollowUpAt >= today && p.nextFollowUpAt < tomorrow;
    });

    const recentReplies = prospects.filter(
      (p) =>
        ["replied_interested", "replied_objection", "in_conversation"].includes(p.pipelineStage) &&
        p.updatedAt >= oneDayAgo,
    );

    const dmsSentToday = prospects.filter(
      (p) => p.firstContactedAt && p.firstContactedAt >= today,
    ).length;

    return { overdue, dueToday, recentReplies, dmsSentToday };
  }, [prospects]);

  return { data, loading };
}
