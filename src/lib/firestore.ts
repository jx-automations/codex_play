import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

import { DEFAULT_USER_SETTINGS, type Prospect, type UserSettings } from "@/types";

// ── Path helpers ────────────────────────────────────────────────────────────

export function prospectsCol(db: Firestore, teamId: string) {
  return collection(db, "teams", teamId, "prospects");
}

export function prospectDoc(db: Firestore, teamId: string, prospectId: string) {
  return doc(db, "teams", teamId, "prospects", prospectId);
}

export function settingsDoc(db: Firestore, teamId: string) {
  return doc(db, "teams", teamId, "settings", "default");
}

export function userDoc(db: Firestore, uid: string) {
  return doc(db, "users", uid);
}

// ── Serialization ───────────────────────────────────────────────────────────

function toFirestore(prospect: Prospect): Record<string, unknown> {
  return {
    ...prospect,
    firstContactedAt: prospect.firstContactedAt ? Timestamp.fromDate(prospect.firstContactedAt) : null,
    lastContactedAt:  prospect.lastContactedAt  ? Timestamp.fromDate(prospect.lastContactedAt)  : null,
    nextFollowUpAt:   prospect.nextFollowUpAt   ? Timestamp.fromDate(prospect.nextFollowUpAt)   : null,
    createdAt:  Timestamp.fromDate(prospect.createdAt),
    updatedAt:  Timestamp.fromDate(prospect.updatedAt),
  };
}

function fromFirestore(id: string, data: Record<string, unknown>): Prospect {
  function toDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Timestamp) return v.toDate();
    if (typeof v === "string") return new Date(v);
    return null;
  }
  return {
    id,
    instagramHandle:  String(data.instagramHandle  ?? ""),
    instagramUrl:     String(data.instagramUrl     ?? ""),
    fullName:         String(data.fullName         ?? ""),
    bio:              String(data.bio              ?? ""),
    profilePicUrl:    String(data.profilePicUrl    ?? ""),
    followerCount:    data.followerCount  != null ? Number(data.followerCount)  : null,
    followingCount:   data.followingCount != null ? Number(data.followingCount) : null,
    postCount:        data.postCount      != null ? Number(data.postCount)      : null,
    email:            data.email    ? String(data.email)    : null,
    phone:            data.phone    ? String(data.phone)    : null,
    website:          data.website  ? String(data.website)  : null,
    businessCategory: data.businessCategory ? String(data.businessCategory) : null,
    pipelineStage:    (data.pipelineStage as Prospect["pipelineStage"]) ?? "prospect_found",
    tags:             Array.isArray(data.tags) ? (data.tags as string[]) : [],
    customFields:     (data.customFields as Record<string, string>) ?? {},
    addedBy:          String(data.addedBy    ?? ""),
    assignedTo:       data.assignedTo ? String(data.assignedTo) : null,
    firstContactedAt: toDate(data.firstContactedAt),
    lastContactedAt:  toDate(data.lastContactedAt),
    nextFollowUpAt:   toDate(data.nextFollowUpAt),
    createdAt:  toDate(data.createdAt)  ?? new Date(),
    updatedAt:  toDate(data.updatedAt)  ?? new Date(),
    source: (data.source as Prospect["source"]) ?? "manual",
  };
}

// ── Prospects ───────────────────────────────────────────────────────────────

export function subscribeToProspects(
  db: Firestore,
  teamId: string,
  onData: (prospects: Prospect[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    prospectsCol(db, teamId),
    (snapshot) => {
      onData(snapshot.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>)));
    },
    onError,
  );
}

export async function writeProspect(db: Firestore, teamId: string, prospect: Prospect): Promise<void> {
  await setDoc(prospectDoc(db, teamId, prospect.id), toFirestore(prospect));
}

export async function deleteProspectDoc(db: Firestore, teamId: string, prospectId: string): Promise<void> {
  await deleteDoc(prospectDoc(db, teamId, prospectId));
}

export async function batchWriteProspects(db: Firestore, teamId: string, prospects: Prospect[]): Promise<void> {
  const chunks = chunkArray(prospects, 250);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((p) => batch.set(prospectDoc(db, teamId, p.id), toFirestore(p)));
    await batch.commit();
  }
}

export async function batchDeleteProspects(db: Firestore, teamId: string, ids: string[]): Promise<void> {
  const chunks = chunkArray(ids, 250);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((id) => batch.delete(prospectDoc(db, teamId, id)));
    await batch.commit();
  }
}

export async function getAllProspects(db: Firestore, teamId: string): Promise<Prospect[]> {
  const snap = await getDocs(prospectsCol(db, teamId));
  return snap.docs.map((d) => fromFirestore(d.id, d.data() as Record<string, unknown>));
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function fetchSettings(db: Firestore, teamId: string): Promise<UserSettings> {
  const snap = await getDoc(settingsDoc(db, teamId));
  if (!snap.exists()) return DEFAULT_USER_SETTINGS;
  return { ...DEFAULT_USER_SETTINGS, ...(snap.data() as Partial<UserSettings>) };
}

export function subscribeToSettings(
  db: Firestore,
  teamId: string,
  onData: (settings: UserSettings) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    settingsDoc(db, teamId),
    (snap) => {
      if (snap.exists()) {
        onData({ ...DEFAULT_USER_SETTINGS, ...(snap.data() as Partial<UserSettings>) });
      } else {
        onData(DEFAULT_USER_SETTINGS);
      }
    },
    onError,
  );
}

export async function writeSettings(db: Firestore, teamId: string, settings: UserSettings): Promise<void> {
  await setDoc(settingsDoc(db, teamId), settings, { merge: true });
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
