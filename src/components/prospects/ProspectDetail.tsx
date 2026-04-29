"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MessageCircle, Reply, Send, StickyNote, Trash2 } from "lucide-react";

import { StageBadge } from "@/components/ui/StageBadge";
import { useAuth } from "@/context/auth-context";
import { useSettings } from "@/hooks/useSettings";
import { getFirebaseDb } from "@/lib/firebase";
import { addNote, deleteProspectDoc, subscribeToNotes, writeProspect } from "@/lib/firestore";
import { useProspects } from "@/hooks/useProspects";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type Note,
  type PipelineStage,
  type Prospect,
} from "@/types";

interface ProspectDetailProps {
  prospectId: string;
}

function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
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

const NOTE_ICONS: Record<Note["type"], React.ReactNode> = {
  message_sent:     <Send className="h-3.5 w-3.5" />,
  message_received: <Reply className="h-3.5 w-3.5" />,
  stage_change:     <ArrowUpRight className="h-3.5 w-3.5" />,
  note:             <StickyNote className="h-3.5 w-3.5" />,
};

const NOTE_COLORS: Record<Note["type"], string> = {
  message_sent:     "bg-blue-50 text-blue-500",
  message_received: "bg-emerald-50 text-emerald-500",
  stage_change:     "bg-violet-50 text-violet-500",
  note:             "bg-neutral-100 text-neutral-500",
};

export function ProspectDetail({ prospectId }: ProspectDetailProps) {
  const { prospects } = useProspects();
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();

  const prospect = prospects.find((p) => p.id === prospectId);

  const [notes, setNotes] = useState<Note[]>([]);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user || !prospect) return;
    const db = getFirebaseDb();
    if (!db) return;
    const unsub = subscribeToNotes(db, user.uid, prospect.id, setNotes, console.error);
    return unsub;
  }, [user, prospect]);

  useEffect(() => {
    if (showNoteInput) setTimeout(() => noteRef.current?.focus(), 50);
  }, [showNoteInput]);

  if (!prospect) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-neutral-500">Prospect not found.</p>
        <Link href="/prospects" className="text-sm font-medium text-primary">← Back to prospects</Link>
      </div>
    );
  }

  const followUpMs = (settings.followUpIntervalDays ?? 2) * 86_400_000;

  async function writeNote(type: Note["type"], content: string) {
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) return;
    await addNote(db, user.uid, prospect!.id, {
      id: genId(),
      type,
      content,
      createdBy: user.uid,
      createdAt: new Date(),
    });
  }

  async function logDm() {
    if (!user || saving) return;
    setSaving(true);
    const db = getFirebaseDb();
    if (!db) { setSaving(false); return; }
    const now = new Date();
    try {
      await Promise.all([
        writeNote("message_sent", "DM sent"),
        writeProspect(db, user.uid, {
          ...prospect!,
          pipelineStage: prospect!.pipelineStage === "prospect_found" ? "first_dm_sent" : prospect!.pipelineStage,
          firstContactedAt: prospect!.firstContactedAt ?? now,
          lastContactedAt: now,
          nextFollowUpAt: new Date(now.getTime() + followUpMs),
          updatedAt: now,
        }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function logReply() {
    if (!user || saving) return;
    setSaving(true);
    const db = getFirebaseDb();
    if (!db) { setSaving(false); return; }
    const now = new Date();
    const replyStages: PipelineStage[] = ["replied_interested", "replied_objection", "in_conversation", "call_scheduled", "won"];
    const alreadyReplied = replyStages.includes(prospect!.pipelineStage);
    try {
      await Promise.all([
        writeNote("message_received", "Reply received"),
        writeProspect(db, user.uid, {
          ...prospect!,
          pipelineStage: alreadyReplied ? prospect!.pipelineStage : "replied_interested",
          lastContactedAt: now,
          nextFollowUpAt: new Date(now.getTime() + followUpMs),
          updatedAt: now,
        }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function submitNote() {
    const text = noteText.trim();
    if (!text) return;
    setSaving(true);
    try {
      await writeNote("note", text);
      setNoteText("");
      setShowNoteInput(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateStage(newStage: PipelineStage) {
    if (!user || saving) return;
    const db = getFirebaseDb();
    if (!db) return;
    setSaving(true);
    const now = new Date();
    try {
      await Promise.all([
        writeNote("stage_change", `Stage → ${PIPELINE_STAGE_LABELS[newStage]}`),
        writeProspect(db, user.uid, { ...prospect!, pipelineStage: newStage, updatedAt: now }),
      ]);
      setShowStageSelector(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) return;
    await deleteProspectDoc(db, user.uid, prospect!.id);
    router.push("/prospects");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Back nav */}
      <div className="flex items-center border-b border-neutral-100 bg-white px-2 py-1">
        <Link
          href="/prospects"
          className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-200"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Prospects
        </Link>
      </div>

      {/* Profile header */}
      <div className="bg-white px-4 py-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
            {prospect.instagramHandle.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-semibold text-neutral-900">@{prospect.instagramHandle}</h1>
            {prospect.fullName && <p className="text-sm text-neutral-500">{prospect.fullName}</p>}
            <a
              href={`https://instagram.com/${prospect.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View on Instagram <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Stage */}
        <div className="mt-4">
          <button type="button" onClick={() => setShowStageSelector((v) => !v)} className="flex items-center gap-2">
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
                    s === prospect.pipelineStage ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {PIPELINE_STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-xs text-neutral-400">Added</p><p className="font-medium text-neutral-700">{formatDate(prospect.createdAt)}</p></div>
          <div><p className="text-xs text-neutral-400">Last contact</p><p className="font-medium text-neutral-700">{timeAgo(prospect.lastContactedAt)}</p></div>
          <div>
            <p className="text-xs text-neutral-400">Next follow-up</p>
            <p className={`font-medium ${prospect.nextFollowUpAt && prospect.nextFollowUpAt < new Date() ? "text-danger" : "text-neutral-700"}`}>
              {formatDate(prospect.nextFollowUpAt)}
            </p>
          </div>
          <div><p className="text-xs text-neutral-400">Source</p><p className="font-medium text-neutral-700 capitalize">{prospect.source}</p></div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mx-4 mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">Quick actions</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={logDm}
            disabled={saving}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 py-3 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Log DM
          </button>
          <button
            type="button"
            onClick={logReply}
            disabled={saving}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-emerald-100 bg-emerald-50 py-3 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
          >
            <Reply className="h-4 w-4" />
            Got Reply
          </button>
          <button
            type="button"
            onClick={() => setShowNoteInput((v) => !v)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white py-3 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <MessageCircle className="h-4 w-4" />
            Add Note
          </button>
        </div>

        {showNoteInput && (
          <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3">
            <textarea
              ref={noteRef}
              rows={3}
              placeholder="Write a note…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full resize-none text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowNoteInput(false); setNoteText(""); }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNote}
                disabled={!noteText.trim() || saving}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bio */}
      {prospect.bio && (
        <div className="mx-4 mt-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs font-medium text-neutral-400">Bio</p>
          <p className="text-sm text-neutral-700">{prospect.bio}</p>
        </div>
      )}

      {/* Stats */}
      {(prospect.followerCount != null || prospect.followingCount != null || prospect.postCount != null) && (
        <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
          {prospect.followerCount != null && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 text-center shadow-sm">
              <p className="font-heading text-lg font-semibold text-neutral-900">{prospect.followerCount.toLocaleString()}</p>
              <p className="text-xs text-neutral-400">followers</p>
            </div>
          )}
          {prospect.followingCount != null && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 text-center shadow-sm">
              <p className="font-heading text-lg font-semibold text-neutral-900">{prospect.followingCount.toLocaleString()}</p>
              <p className="text-xs text-neutral-400">following</p>
            </div>
          )}
          {prospect.postCount != null && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 text-center shadow-sm">
              <p className="font-heading text-lg font-semibold text-neutral-900">{prospect.postCount.toLocaleString()}</p>
              <p className="text-xs text-neutral-400">posts</p>
            </div>
          )}
        </div>
      )}

      {/* Activity timeline */}
      <div className="mx-4 mt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">Activity</p>
        {notes.length === 0 ? (
          <p className="rounded-2xl border border-neutral-100 bg-white px-4 py-6 text-center text-sm text-neutral-400">
            No activity yet — log a DM to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-3 shadow-sm">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${NOTE_COLORS[note.type]}`}>
                  {NOTE_ICONS[note.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-800">{note.content}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{timeAgo(note.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <div className="mx-4 mt-8 mb-8">
        {confirmDelete ? (
          <div className="rounded-xl border border-danger/30 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-neutral-700">Delete this prospect permanently?</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDelete} className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white">Yes, delete</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-danger hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete prospect
          </button>
        )}
      </div>
    </div>
  );
}
