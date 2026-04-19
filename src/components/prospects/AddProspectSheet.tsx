"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { useAddProspect } from "@/context/add-prospect-context";
import { getFirebaseDb } from "@/lib/firebase";
import { writeProspect } from "@/lib/firestore";
import { useSettings } from "@/hooks/useSettings";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, STAGE_BADGE_CLASSES, type PipelineStage, type Prospect } from "@/types";

function extractHandle(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
  if (urlMatch) return urlMatch[1];
  return trimmed.replace(/^@/, "");
}

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function AddProspectSheet() {
  const { isOpen, close, prefillHandle } = useAddProspect();
  const { user } = useAuth();
  const { settings } = useSettings();

  const [handle, setHandle]   = useState("");
  const [name, setName]       = useState("");
  const [note, setNote]       = useState("");
  const [stage, setStage]     = useState<PipelineStage>("first_dm_sent");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHandle(prefillHandle ? extractHandle(prefillHandle) : "");
      setName("");
      setNote("");
      setStage("first_dm_sent");
      setError("");
      setSaving(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, prefillHandle]);

  async function handleSave() {
    const cleanHandle = extractHandle(handle);
    if (!cleanHandle) {
      setError("Instagram handle is required.");
      return;
    }
    if (!user) return;

    const db = getFirebaseDb();
    if (!db) return;

    const now = new Date();
    const followUpDays = settings.followUpIntervalDays ?? 2;
    const nextFollowUp = new Date(now.getTime() + followUpDays * 86_400_000);
    const isContacted = stage !== "prospect_found";

    const prospect: Prospect = {
      id:               generateId(),
      instagramHandle:  cleanHandle,
      instagramUrl:     `https://instagram.com/${cleanHandle}`,
      fullName:         name.trim(),
      bio:              "",
      profilePicUrl:    "",
      followerCount:    null,
      followingCount:   null,
      postCount:        null,
      email:            null,
      phone:            null,
      website:          null,
      businessCategory: null,
      pipelineStage:    stage,
      tags:             [],
      customFields:     {},
      addedBy:          user.uid,
      assignedTo:       null,
      firstContactedAt: isContacted ? now : null,
      lastContactedAt:  isContacted ? now : null,
      nextFollowUpAt:   nextFollowUp,
      createdAt:        now,
      updatedAt:        now,
      source:           "manual",
    };

    setSaving(true);
    try {
      await writeProspect(db, user.uid, prospect);
      close();
    } catch {
      setError("Failed to save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add prospect"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white shadow-lg"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        <div className="px-4 pb-8 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-neutral-900">Add Prospect</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="ap-handle" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Instagram handle <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">@</span>
              <input
                ref={inputRef}
                id="ap-handle"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="username or paste URL"
                value={handle}
                onChange={(e) => { setHandle(e.target.value); setError(""); }}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-8 pr-3 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="ap-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Full name <span className="text-xs font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              id="ap-name"
              type="text"
              placeholder="Real name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Pipeline stage</p>
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {PIPELINE_STAGES.map((s) => {
                const active = stage === s;
                const cls = STAGE_BADGE_CLASSES[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${cls.bg} ${cls.text} ${active ? "ring-2 ring-primary/50 scale-105" : "opacity-60 hover:opacity-100"}`}
                  >
                    {PIPELINE_STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="ap-note" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Quick note <span className="text-xs font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="ap-note"
              rows={2}
              placeholder="Context, niche, how you found them…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add Prospect"}
          </button>
        </div>
      </div>
    </>
  );
}
