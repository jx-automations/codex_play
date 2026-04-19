"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StageBadge } from "@/components/ui/StageBadge";
import { useAuth } from "@/context/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import { deleteProspectDoc, writeProspect } from "@/lib/firestore";
import { useProspects } from "@/hooks/useProspects";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type PipelineStage,
  type Prospect,
} from "@/types";

interface ProspectDetailProps {
  prospectId: string;
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(d: Date | null): string {
  if (!d) return "never";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function ProspectDetail({ prospectId }: ProspectDetailProps) {
  const { prospects } = useProspects();
  const { user } = useAuth();
  const router = useRouter();

  const prospect = prospects.find((p) => p.id === prospectId);

  const [showStageSelector, setShowStageSelector] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!prospect) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-neutral-500">Prospect not found.</p>
        <Link href="/prospects" className="text-sm font-medium text-primary">
          ← Back to prospects
        </Link>
      </div>
    );
  }

  async function updateStage(newStage: PipelineStage) {
    if (!user || !prospect) return;
    const db = getFirebaseDb();
    if (!db) return;
    setSaving(true);
    try {
      await writeProspect(db, user.uid, {
        ...prospect,
        pipelineStage: newStage,
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      });
      setShowStageSelector(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !prospect) return;
    const db = getFirebaseDb();
    if (!db) return;
    await deleteProspectDoc(db, user.uid, prospect.id);
    router.push("/prospects");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Back nav */}
      <div className="flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-3">
        <Link href="/prospects" className="text-sm font-medium text-neutral-500 hover:text-neutral-700">
          ← Prospects
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-white px-4 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
            {prospect.instagramHandle.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold text-neutral-900">
              @{prospect.instagramHandle}
            </h1>
            {prospect.fullName && (
              <p className="text-sm text-neutral-500">{prospect.fullName}</p>
            )}
            <a
              href={`https://instagram.com/${prospect.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              View on Instagram ↗
            </a>
          </div>
        </div>

        {/* Stage badge + selector */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowStageSelector((v) => !v)}
            className="flex items-center gap-2"
          >
            <StageBadge stage={prospect.pipelineStage} />
            <span className="text-xs text-neutral-400">tap to change</span>
          </button>

          {showStageSelector && (
            <div className="mt-3 flex flex-wrap gap-2">
              {PIPELINE_STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving}
                  onClick={() => updateStage(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    s === prospect.pipelineStage
                      ? "bg-primary text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {PIPELINE_STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick info */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-neutral-400">Added</p>
            <p className="font-medium text-neutral-700">{formatDate(prospect.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Last contact</p>
            <p className="font-medium text-neutral-700">{timeAgo(prospect.lastContactedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Next follow-up</p>
            <p className={`font-medium ${prospect.nextFollowUpAt && prospect.nextFollowUpAt < new Date() ? "text-danger" : "text-neutral-700"}`}>
              {formatDate(prospect.nextFollowUpAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Source</p>
            <p className="font-medium text-neutral-700 capitalize">{prospect.source}</p>
          </div>
        </div>
      </div>

      {/* Bio section */}
      {prospect.bio && (
        <div className="mx-4 mt-4 rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-neutral-400">Bio</p>
          <p className="text-sm text-neutral-700">{prospect.bio}</p>
        </div>
      )}

      {/* Stats */}
      {(prospect.followerCount || prospect.followingCount || prospect.postCount) && (
        <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
          {prospect.followerCount != null && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 text-center shadow-sm">
              <p className="font-display text-lg font-semibold text-neutral-900">
                {prospect.followerCount.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">followers</p>
            </div>
          )}
          {prospect.followingCount != null && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 text-center shadow-sm">
              <p className="font-display text-lg font-semibold text-neutral-900">
                {prospect.followingCount.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">following</p>
            </div>
          )}
          {prospect.postCount != null && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 text-center shadow-sm">
              <p className="font-display text-lg font-semibold text-neutral-900">
                {prospect.postCount.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">posts</p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {prospect.tags.length > 0 && (
        <div className="mx-4 mt-4 flex flex-wrap gap-2">
          {prospect.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Delete */}
      <div className="mx-4 mt-8 mb-6">
        {confirmDelete ? (
          <div className="rounded-xl border border-danger/30 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-neutral-700">Delete this prospect permanently?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white"
              >
                Yes, delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full rounded-xl border border-neutral-200 py-3 text-sm font-medium text-danger hover:bg-red-50"
          >
            Delete prospect
          </button>
        )}
      </div>
    </div>
  );
}
