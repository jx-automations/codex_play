"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useAddProspect } from "@/context/add-prospect-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { TodayProspectCard } from "@/components/today/TodayProspectCard";
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

function isOverdue(prospect: Prospect): boolean {
  if (!prospect.nextFollowUpAt) return false;
  return prospect.nextFollowUpAt < todayStart();
}

function isDueToday(prospect: Prospect): boolean {
  if (!prospect.nextFollowUpAt) return false;
  const t = prospect.nextFollowUpAt;
  return t >= todayStart() && t < tomorrowStart();
}

function isRecentReply(prospect: Prospect): boolean {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return (
    (prospect.pipelineStage === "replied_interested" ||
      prospect.pipelineStage === "replied_objection" ||
      prospect.pipelineStage === "in_conversation") &&
    prospect.updatedAt >= cutoff
  );
}

function overdueDays(prospect: Prospect): number {
  if (!prospect.nextFollowUpAt) return 0;
  return Math.ceil((todayStart().getTime() - prospect.nextFollowUpAt.getTime()) / 86400000);
}

interface SectionProps {
  title: string;
  badge?: number;
  badgeLevel?: "danger" | "warning" | "success";
  children: React.ReactNode;
}

function Section({ title, badge, badgeLevel = "warning", children }: SectionProps) {
  const badgeColors = {
    danger:  "bg-red-100 text-danger",
    warning: "bg-amber-100 text-warning",
    success: "bg-emerald-100 text-success",
  };
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          {title}
        </h2>
        {badge !== undefined && badge > 0 && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColors[badgeLevel]}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function TodayView() {
  const { prospects, loading } = useProspects();
  const { open } = useAddProspect();
  const searchParams = useSearchParams();

  // Auto-open add sheet when navigated from share target (?add=true&handle=...)
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      const handle = searchParams.get("handle") ?? "";
      open(handle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const overdue = prospects.filter(isOverdue).sort((a, b) => {
    const aDate = a.nextFollowUpAt!.getTime();
    const bDate = b.nextFollowUpAt!.getTime();
    return aDate - bDate;
  });
  const dueToday = prospects.filter(isDueToday);
  const recentReplies = prospects.filter(isRecentReply);

  const allEmpty = overdue.length === 0 && dueToday.length === 0 && recentReplies.length === 0;

  return (
    <div className="px-4 py-4">
      {allEmpty ? (
        <EmptyState
          title="You're all caught up."
          description="No overdue follow-ups and no replies needing attention. Time to find new prospects."
          action={
            <button
              type="button"
              onClick={() => open()}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Add a prospect
            </button>
          }
        />
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title="Overdue" badge={overdue.length} badgeLevel="danger">
              <div className="space-y-2">
                {overdue.map((p) => (
                  <TodayProspectCard
                    key={p.id}
                    prospect={p}
                    urgencyText={`${overdueDays(p)}d overdue`}
                    urgencyLevel="danger"
                  />
                ))}
              </div>
            </Section>
          )}

          {dueToday.length > 0 && (
            <Section title="Due Today" badge={dueToday.length} badgeLevel="warning">
              <div className="space-y-2">
                {dueToday.map((p) => (
                  <TodayProspectCard
                    key={p.id}
                    prospect={p}
                    urgencyText="Due today"
                    urgencyLevel="warning"
                  />
                ))}
              </div>
            </Section>
          )}

          {recentReplies.length > 0 && (
            <Section title="Recent Replies" badge={recentReplies.length} badgeLevel="success">
              <div className="space-y-2">
                {recentReplies.map((p) => (
                  <TodayProspectCard
                    key={p.id}
                    prospect={p}
                    urgencyText="Needs response"
                    urgencyLevel="success"
                  />
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
