"use client";

import { useDeferredValue, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ProspectCard } from "@/components/prospects/ProspectCard";
import { useAddProspect } from "@/context/add-prospect-context";
import { useProspects } from "@/hooks/useProspects";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES, type PipelineStage, type Prospect } from "@/types";

type SortKey = "date_added" | "next_followup" | "last_contacted" | "alpha";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_added",    label: "Date added" },
  { value: "next_followup", label: "Next follow-up" },
  { value: "last_contacted",label: "Last contacted" },
  { value: "alpha",         label: "A–Z" },
];

function sortProspects(prospects: Prospect[], by: SortKey): Prospect[] {
  return [...prospects].sort((a, b) => {
    switch (by) {
      case "next_followup":
        if (!a.nextFollowUpAt && !b.nextFollowUpAt) return 0;
        if (!a.nextFollowUpAt) return 1;
        if (!b.nextFollowUpAt) return -1;
        return a.nextFollowUpAt.getTime() - b.nextFollowUpAt.getTime();
      case "last_contacted":
        if (!a.lastContactedAt && !b.lastContactedAt) return 0;
        if (!a.lastContactedAt) return 1;
        if (!b.lastContactedAt) return -1;
        return b.lastContactedAt.getTime() - a.lastContactedAt.getTime();
      case "alpha":
        return a.instagramHandle.localeCompare(b.instagramHandle);
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
}

export function ProspectList() {
  const { prospects, loading } = useProspects();
  const { open } = useAddProspect();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "">("");
  const [sort, setSort] = useState<SortKey>("date_added");

  const deferredSearch = useDeferredValue(search);

  const filtered = sortProspects(
    prospects.filter((p) => {
      if (stageFilter && p.pipelineStage !== stageFilter) return false;
      if (!deferredSearch) return true;
      const q = deferredSearch.toLowerCase();
      return (
        p.instagramHandle.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        (p.businessCategory ?? "").toLowerCase().includes(q)
      );
    }),
    sort,
  );

  if (loading) {
    return (
      <div className="space-y-px">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-16 animate-pulse bg-neutral-100" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search handle, name, category…"
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        {/* Filter chips */}
        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setStageFilter("")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              stageFilter === "" ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            All
          </button>
          {PIPELINE_STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStageFilter(stageFilter === s ? "" : s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                stageFilter === s ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {PIPELINE_STAGE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-neutral-400">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600 outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-neutral-400">{filtered.length} prospect{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title={search || stageFilter ? "No prospects match your search." : "No prospects yet."}
          description={!search && !stageFilter ? "Tap + to add your first prospect." : undefined}
          action={
            !search && !stageFilter ? (
              <button
                type="button"
                onClick={() => open()}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Add prospect
              </button>
            ) : undefined
          }
        />
      ) : (
        <div>
          {filtered.map((p) => (
            <ProspectCard key={p.id} prospect={p} />
          ))}
        </div>
      )}
    </div>
  );
}
