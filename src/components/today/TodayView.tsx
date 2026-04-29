"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useAddProspect } from "@/context/add-prospect-context";
import { useAuth } from "@/context/auth-context";
import { useProspects } from "@/hooks/useProspects";
import { useSettings } from "@/hooks/useSettings";
import { getFirebaseDb } from "@/lib/firebase";
import { subscribeTodayDmCount } from "@/lib/firestore";
import { StageBadge } from "@/components/ui/StageBadge";
import { type Prospect } from "@/types";

// ── Date helpers ────────────────────────────────────────────────────────────

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function tomorrowMidnight(): Date {
  const d = todayMidnight();
  d.setDate(d.getDate() + 1);
  return d;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function hoursSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 3_600_000);
}

function overdueDays(prospect: Prospect): number {
  if (!prospect.nextFollowUpAt) return 0;
  return Math.ceil((todayMidnight().getTime() - prospect.nextFollowUpAt.getTime()) / 86_400_000);
}

// ── Section header ──────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  level,
}: {
  title: string;
  count: number;
  level: "danger" | "warning" | "success";
}) {
  const colors = {
    danger:  "bg-red-100 text-danger",
    warning: "bg-amber-100 text-warning",
    success: "bg-emerald-100 text-success",
  };
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="font-heading text-xs font-medium uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      {count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[level]}`}>
          {count}
        </span>
      )}
    </div>
  );
}

// ── Prospect card ───────────────────────────────────────────────────────────

function TodayCard({
  prospect,
  meta,
  metaColor = "text-neutral-400",
}: {
  prospect: Prospect;
  meta: string;
  metaColor?: string;
}) {
  const initials = prospect.instagramHandle.slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/prospects/${prospect.id}`}
      className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all duration-150 hover:border-neutral-200 hover:shadow-md active:bg-neutral-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">@{prospect.instagramHandle}</p>
        {prospect.fullName && (
          <p className="truncate text-xs text-neutral-500">{prospect.fullName}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StageBadge stage={prospect.pipelineStage} />
        <span className={`text-xs font-medium ${metaColor}`}>{meta}</span>
      </div>
    </Link>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function TodayView() {
  const { prospects, loading } = useProspects();
  const { settings } = useSettings();
  const { open } = useAddProspect();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Notes-based DM count — falls back to 0 if index not yet deployed
  const [notesDmCount, setNotesDmCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) return;
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const unsub = subscribeTodayDmCount(db, user.uid, midnight, (count) => setNotesDmCount(count));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      open(searchParams.get("handle") ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { overdue, dueToday, recentReplies, dmsSentToday } = useMemo(() => {
    const now = new Date();
    const midnight = todayMidnight();
    const tomorrow = tomorrowMidnight();
    const yesterday = new Date(now.getTime() - 86_400_000);
    const dailyGoal = settings.dailyGoal ?? 10;

    const overdue = prospects.filter(
      (p) =>
        p.nextFollowUpAt &&
        p.nextFollowUpAt < midnight &&
        p.pipelineStage !== "won" &&
        p.pipelineStage !== "lost",
    ).sort((a, b) => (a.nextFollowUpAt!.getTime() - b.nextFollowUpAt!.getTime()));

    const dueToday = prospects.filter(
      (p) =>
        p.nextFollowUpAt &&
        p.nextFollowUpAt >= midnight &&
        p.nextFollowUpAt < tomorrow &&
        p.pipelineStage !== "won" &&
        p.pipelineStage !== "lost",
    );

    const recentReplies = prospects.filter(
      (p) =>
        (p.pipelineStage === "replied_interested" ||
          p.pipelineStage === "replied_objection" ||
          p.pipelineStage === "in_conversation") &&
        p.updatedAt >= yesterday,
    );

    // Approximate DMs sent today = prospects first contacted today
    const dmsSentToday = prospects.filter(
      (p) => p.firstContactedAt && p.firstContactedAt >= midnight && p.firstContactedAt < tomorrow,
    ).length;

    return { overdue, dueToday, recentReplies, dmsSentToday };
  }, [prospects, settings.dailyGoal]);

  const dailyGoal = settings.dailyGoal ?? 10;
  // Prefer notes-based count (accurate) over prospect-based approximation
  const dmsCount = notesDmCount ?? dmsSentToday;

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  const allEmpty =
    overdue.length === 0 && dueToday.length === 0 && recentReplies.length === 0;

  const progressPct = Math.min(100, (dmsSentToday / dailyGoal) * 100);
  const goalReached = dmsSentToday >= dailyGoal;

  return (
    <div className="px-4 pb-8 pt-6 space-y-6">

      {/* Date header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-heading text-xs font-medium uppercase tracking-wider text-neutral-400">Today</p>
          <h1 className="font-heading text-xl font-semibold text-neutral-900">{todayLabel}</h1>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>

      {/* ── Section A: Daily Progress ── */}
      <section>
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="font-heading text-sm font-medium text-neutral-700">DMs sent today</p>
            <p className="font-heading text-lg font-semibold text-neutral-900">
              {dmsCount}
              <span className="text-sm font-normal text-neutral-400"> / {dailyGoal}</span>
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (dmsCount / dailyGoal) * 100)}%` }}
            />
          </div>
          <p className={`mt-2 text-xs font-medium ${dmsCount >= dailyGoal ? "text-success" : "text-neutral-400"}`}>
            {dmsCount >= dailyGoal
              ? "Goal reached!"
              : `${dailyGoal - dmsCount} to go`}
          </p>
        </div>
      </section>

      {/* ── Sections B/C/D or empty state ── */}
      {allEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
            <span className="text-3xl">✓</span>
          </div>
          <div>
            <p className="font-heading font-semibold text-neutral-900">You&apos;re all caught up.</p>
            <p className="mt-1 max-w-xs text-sm text-neutral-500">
              No overdue follow-ups and no replies needing attention.
            </p>
          </div>
          <button
            type="button"
            onClick={() => open()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Add a prospect
          </button>
        </div>
      ) : (
        <>
          {/* Section B — Overdue */}
          {overdue.length > 0 && (
            <section>
              <SectionHeader title="Overdue" count={overdue.length} level="danger" />
              <div className="space-y-2">
                {overdue.map((p) => (
                  <TodayCard
                    key={p.id}
                    prospect={p}
                    meta={`${overdueDays(p)}d overdue`}
                    metaColor="text-danger font-semibold"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section C — Due Today */}
          {dueToday.length > 0 && (
            <section>
              <SectionHeader title="Due Today" count={dueToday.length} level="warning" />
              <div className="space-y-2">
                {dueToday.map((p) => (
                  <TodayCard
                    key={p.id}
                    prospect={p}
                    meta="Due today"
                    metaColor="text-warning font-semibold"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section D — Recent Replies */}
          {recentReplies.length > 0 && (
            <section>
              <SectionHeader title="Recent Replies" count={recentReplies.length} level="success" />
              <div className="space-y-2">
                {recentReplies.map((p) => (
                  <TodayCard
                    key={p.id}
                    prospect={p}
                    meta={`${hoursSince(p.updatedAt)}h ago`}
                    metaColor="text-success font-semibold"
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
