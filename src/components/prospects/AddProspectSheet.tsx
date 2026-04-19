"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle, Loader2, X } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useAddProspect } from "@/context/add-prospect-context";
import { getFirebaseDb } from "@/lib/firebase";
import { writeProspect } from "@/lib/firestore";
import { useSettings } from "@/hooks/useSettings";
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
  STAGE_BADGE_CLASSES,
  type PipelineStage,
  type Prospect,
} from "@/types";

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractHandle(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
  if (urlMatch) return urlMatch[1];
  return trimmed.replace(/^@/, "");
}

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

type LookupStatus = "idle" | "loading" | "found" | "not_found";

interface ProfileData {
  fullName?: string;
  bio?: string;
  followerCount?: number | null;
  followingCount?: number | null;
  postCount?: number | null;
  profilePicUrl?: string;
  businessCategory?: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export function AddProspectSheet() {
  const { isOpen, close, prefillHandle } = useAddProspect();
  const { user } = useAuth();
  const { settings } = useSettings();

  const [handle, setHandle]     = useState("");
  const [name, setName]         = useState("");
  const [note, setNote]         = useState("");
  const [stage, setStage]       = useState<PipelineStage>("first_dm_sent");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [profileData, setProfileData]   = useState<ProfileData | null>(null);

  const inputRef   = useRef<HTMLInputElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      const pre = prefillHandle ? extractHandle(prefillHandle) : "";
      setHandle(pre);
      setName("");
      setNote("");
      setStage("first_dm_sent");
      setError("");
      setSaving(false);
      setLookupStatus("idle");
      setProfileData(null);
      setTimeout(() => inputRef.current?.focus(), 50);
      if (pre) triggerLookup(pre);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Debounced Instagram lookup
  const triggerLookup = useCallback(
    debounce(async (raw: string) => {
      const h = extractHandle(raw);
      if (h.length < 2) { setLookupStatus("idle"); return; }
      setLookupStatus("loading");
      try {
        const res = await fetch(`/api/instagram/lookup?handle=${encodeURIComponent(h)}`);
        const data: ProfileData & { error?: string } = await res.json();
        if (data.error || !res.ok) {
          setLookupStatus("not_found");
        } else {
          setProfileData(data);
          setLookupStatus("found");
          if (data.fullName) setName(data.fullName);
          if (data.bio)      setNote(data.bio.slice(0, 120));
        }
      } catch {
        setLookupStatus("not_found");
      }
    }, 800),
    [],
  );

  function handleHandleChange(raw: string) {
    setHandle(raw);
    setError("");
    setLookupStatus("idle");
    setProfileData(null);
    if (raw.trim().length >= 2) triggerLookup(raw);
  }

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLookupStatus("loading");
    try {
      const form = new FormData();
      form.append("image", file);
      const res  = await fetch("/api/instagram/parse-screenshot", { method: "POST", body: form });
      const data: ProfileData & { error?: string; instagramHandle?: string } = await res.json();
      if (data.error || !res.ok) {
        setLookupStatus("not_found");
      } else {
        setProfileData(data);
        setLookupStatus("found");
        if (data.instagramHandle) setHandle(data.instagramHandle);
        if (data.fullName)        setName(data.fullName);
        if (data.bio)             setNote(data.bio.slice(0, 120));
      }
    } catch {
      setLookupStatus("not_found");
    }
    // reset file input
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSave() {
    const cleanHandle = extractHandle(handle);
    if (!cleanHandle) { setError("Instagram handle is required."); return; }
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) return;

    const now          = new Date();
    const followUpDays = settings.followUpIntervalDays ?? 2;
    const nextFollowUp = new Date(now.getTime() + followUpDays * 86_400_000);
    const isContacted  = stage !== "prospect_found";

    const prospect: Prospect = {
      id:               generateId(),
      instagramHandle:  cleanHandle,
      instagramUrl:     `https://instagram.com/${cleanHandle}`,
      fullName:         name.trim(),
      bio:              profileData?.bio ?? "",
      profilePicUrl:    profileData?.profilePicUrl ?? "",
      followerCount:    profileData?.followerCount ?? null,
      followingCount:   profileData?.followingCount ?? null,
      postCount:        profileData?.postCount ?? null,
      email:            null,
      phone:            null,
      website:          null,
      businessCategory: profileData?.businessCategory ?? null,
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add prospect"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white shadow-lg md:left-auto md:right-6 md:bottom-6 md:w-[420px] md:rounded-3xl"
      >
        {/* Handle indicator */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-neutral-200" />
        </div>

        <div className="px-5 pb-8 pt-3">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-neutral-900">Add Prospect</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Handle + camera */}
          <div className="mb-4">
            <label htmlFor="ap-handle" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Instagram handle <span className="text-danger">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-sm text-neutral-400">@</span>
              <input
                ref={inputRef}
                id="ap-handle"
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="username or paste profile URL"
                value={handle}
                onChange={(e) => handleHandleChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-8 pr-20 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {/* Status indicator */}
              {lookupStatus === "loading" && (
                <Loader2 className="absolute right-10 h-4 w-4 animate-spin text-neutral-400" />
              )}
              {lookupStatus === "found" && (
                <CheckCircle className="absolute right-10 h-4 w-4 text-success" />
              )}
              {/* Camera button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute right-3 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                title="Upload screenshot"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshot}
              />
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
            {lookupStatus === "not_found" && (
              <p className="mt-1 text-xs text-neutral-400">Profile not found — fill in manually</p>
            )}
          </div>

          {/* Profile preview on successful lookup */}
          {lookupStatus === "found" && profileData && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              {profileData.profilePicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileData.profilePicUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  width={40}
                  height={40}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                  {extractHandle(handle).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {profileData.fullName || `@${extractHandle(handle)}`}
                </p>
                {profileData.followerCount != null && (
                  <p className="text-xs text-neutral-500">
                    {profileData.followerCount.toLocaleString()} followers
                  </p>
                )}
              </div>
              <CheckCircle className="h-5 w-5 shrink-0 text-success" />
            </div>
          )}

          {/* Full name */}
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
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Stage pills */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-neutral-700">Pipeline stage</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {PIPELINE_STAGES.map((s) => {
                const active = stage === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {PIPELINE_STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick note */}
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
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-primary py-4 font-heading text-base font-semibold text-white transition-colors duration-150 hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : "Add Prospect"}
          </button>
        </div>
      </div>
    </>
  );
}
