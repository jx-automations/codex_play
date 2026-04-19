"use client";

import { useMemo } from "react";

import { useProspects } from "@/hooks/useProspects";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  STAGE_ACCENTS,
  type AnalyticsResult,
  type Prospect,
} from "@/types";

function toRate(top: number, bottom: number): number {
  return bottom ? Math.round((top / bottom) * 100) : 0;
}

export function useAnalytics(): { analytics: AnalyticsResult; loading: boolean } {
  const { prospects, loading } = useProspects();

  const analytics = useMemo((): AnalyticsResult => {
    const total = prospects.length;
    const replied = prospects.filter((p) =>
      ["replied_interested", "replied_objection", "in_conversation", "call_scheduled", "won"].includes(p.pipelineStage),
    ).length;
    const positiveReplied = prospects.filter((p) =>
      ["replied_interested", "in_conversation", "call_scheduled", "won"].includes(p.pipelineStage),
    ).length;
    const won = prospects.filter((p) => p.pipelineStage === "won").length;
    const firstDmSent = prospects.filter((p) => p.pipelineStage !== "prospect_found").length;

    // Stage funnel
    const stageCounts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0]));
    prospects.forEach((p) => { stageCounts[p.pipelineStage] = (stageCounts[p.pipelineStage] ?? 0) + 1; });

    // Daily DMs — last 30 days
    const now = Date.now();
    const dayMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    prospects.forEach((p) => {
      if (p.firstContactedAt) {
        const key = p.firstContactedAt.toISOString().slice(0, 10);
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    });

    return {
      totalProspects: total,
      replyRate: toRate(replied, firstDmSent),
      positiveReplyRate: toRate(positiveReplied, replied),
      conversionRate: toRate(won, total),
      funnelRows: PIPELINE_STAGES.map((s) => ({
        stage: s,
        label: PIPELINE_STAGE_LABELS[s],
        count: stageCounts[s],
        percent: total ? Math.round((stageCounts[s] / total) * 100) : 0,
        accent: STAGE_ACCENTS[s],
      })),
      dailyDms: Array.from(dayMap.entries()).map(([date, count]) => ({ date, count })),
    };
  }, [prospects]);

  return { analytics, loading };
}
