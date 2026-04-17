"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  createId,
  createProspectRecord,
  normalizeProspect,
  normalizeSettings,
  todayString,
  type ConversationLogEntry,
  type Prospect,
  type ProspectFieldUpdate,
  type ProspectInput,
  type UserSettings,
} from "@/lib/outreach";

interface OutreachContextValue {
  prospects: Prospect[];
  settings: UserSettings;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  saveSettings: (nextSettings: Partial<UserSettings>) => Promise<void>;
  addProspect: (input: ProspectInput) => Promise<void>;
  updateStage: (id: string, stage: string, note: string) => Promise<void>;
  addLogEntry: (
    id: string,
    entry: Omit<ConversationLogEntry, "id" | "timestamp">,
  ) => Promise<void>;
  updateProspect: (id: string, updates: ProspectFieldUpdate) => Promise<void>;
  snoozeProspect: (id: string, days: number) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  bulkUpdateStage: (ids: string[], stage: string) => Promise<void>;
  replaceAllData: (
    nextProspects: Prospect[],
    nextSettings?: UserSettings,
  ) => Promise<void>;
  clearProspects: () => Promise<void>;
}

export const FREE_PROSPECT_LIMIT = 25;

const OutreachContext = createContext<OutreachContextValue | null>(null);

function chunk<T>(items: T[], size = 350) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export function OutreachProvider({ children }: { children: ReactNode }) {
  const { configured, status, user } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || status !== "authenticated" || !user) {
      setProspects([]);
      setSettings(DEFAULT_SETTINGS);
      setLoading(status === "loading");
      return undefined;
    }

    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      setError("Firebase Firestore could not be initialized.");
      return undefined;
    }

    setError(null);
    let prospectsReady = false;
    let settingsReady = false;

    const prospectsQuery = query(
      collection(db, "prospects"),
      where("userId", "==", user.uid),
    );
    const settingsRef = doc(db, "userSettings", user.uid);

    function updateLoadingState() {
      setLoading(!(prospectsReady && settingsReady));
    }

    const unsubscribeProspects = onSnapshot(
      prospectsQuery,
      (snapshot) => {
        setProspects(
          snapshot.docs.map((entry) =>
            normalizeProspect({ id: entry.id, ...entry.data() }),
          ),
        );
        prospectsReady = true;
        updateLoadingState();
      },
      (snapshotError) => {
        setError(snapshotError.message);
        prospectsReady = true;
        updateLoadingState();
      },
    );

    const unsubscribeSettings = onSnapshot(
      settingsRef,
      async (snapshot) => {
        settingsReady = true;

        if (snapshot.exists()) {
          setSettings(normalizeSettings(snapshot.data()));
          updateLoadingState();
          return;
        }

        const localSettings = (() => {
          try {
            const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
            return stored
              ? normalizeSettings(JSON.parse(stored) as Partial<UserSettings>)
              : DEFAULT_SETTINGS;
          } catch {
            return DEFAULT_SETTINGS;
          }
        })();

        setSettings(localSettings);
        updateLoadingState();

        try {
          await setDoc(
            settingsRef,
            {
              ...localSettings,
              updatedAt: new Date().toISOString(),
              migratedFromLocalStorage:
                localStorage.getItem(SETTINGS_STORAGE_KEY) !== null,
            },
            { merge: true },
          );
          localStorage.removeItem(SETTINGS_STORAGE_KEY);
        } catch (settingsError) {
          setError(
            settingsError instanceof Error
              ? settingsError.message
              : "Unable to sync settings.",
          );
        }
      },
      (snapshotError) => {
        setError(snapshotError.message);
        settingsReady = true;
        updateLoadingState();
      },
    );

    return () => {
      unsubscribeProspects();
      unsubscribeSettings();
    };
  }, [configured, status, user]);

  async function withMutation(task: () => Promise<void>) {
    setMutating(true);
    setError(null);
    try {
      await task();
    } catch (taskError) {
      setError(
        taskError instanceof Error ? taskError.message : "Something went wrong.",
      );
      throw taskError;
    } finally {
      setMutating(false);
    }
  }

  function requireSession() {
    const db = getFirebaseDb();
    if (!configured || !db || !user) {
      throw new Error(
        "You need Firebase configured and a signed-in user before editing data.",
      );
    }

    return { db, user };
  }

  function findProspect(id: string) {
    const prospect = prospects.find((entry) => entry.id === id);
    if (!prospect) {
      throw new Error("Prospect not found.");
    }
    return prospect;
  }

  async function saveSettings(nextSettings: Partial<UserSettings>) {
    await withMutation(async () => {
      const { db, user: currentUser } = requireSession();
      const merged = normalizeSettings({ ...settings, ...nextSettings });
      await setDoc(
        doc(db, "userSettings", currentUser.uid),
        { ...merged, updatedAt: new Date().toISOString() },
        { merge: true },
      );
    });
  }

  async function addProspect(input: ProspectInput) {
    if (prospects.length >= FREE_PROSPECT_LIMIT) {
      throw new Error(
        `Free plan is limited to ${FREE_PROSPECT_LIMIT} prospects. Upgrade to Pro for unlimited.`,
      );
    }
    await withMutation(async () => {
      const { db, user: currentUser } = requireSession();
      const prospect = createProspectRecord(currentUser.uid, input);
      await setDoc(doc(db, "prospects", prospect.id), prospect);
    });
  }

  async function updateStage(id: string, stage: string, note: string) {
    await withMutation(async () => {
      const { db } = requireSession();
      const prospect = findProspect(id);
      const now = new Date().toISOString();
      await setDoc(doc(db, "prospects", id), {
        ...prospect,
        currentStage: stage,
        stageHistory: [
          ...prospect.stageHistory,
          { stage, timestamp: now, note },
        ],
        lastActionDate: now,
        updatedAt: now,
        conversationLog: [
          ...prospect.conversationLog,
          {
            id: createId(),
            timestamp: now,
            type: "stage-change",
            text: `Stage moved to ${stage}${note ? ` · ${note}` : ""}`,
            link: "",
          },
        ],
      });
    });
  }

  async function addLogEntry(
    id: string,
    entry: Omit<ConversationLogEntry, "id" | "timestamp">,
  ) {
    await withMutation(async () => {
      const { db } = requireSession();
      const prospect = findProspect(id);
      const now = new Date().toISOString();
      await setDoc(doc(db, "prospects", id), {
        ...prospect,
        conversationLog: [
          ...prospect.conversationLog,
          {
            id: createId(),
            timestamp: now,
            type: entry.type,
            text: entry.text.trim(),
            link: entry.link.trim(),
          },
        ],
        updatedAt: now,
      });
    });
  }

  async function updateProspect(id: string, updates: ProspectFieldUpdate) {
    await withMutation(async () => {
      const { db } = requireSession();
      const prospect = findProspect(id);
      await setDoc(doc(db, "prospects", id), {
        ...prospect,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async function snoozeProspect(id: string, days: number) {
    await withMutation(async () => {
      const { db } = requireSession();
      const prospect = findProspect(id);
      const d = new Date();
      d.setDate(d.getDate() + days);
      await setDoc(doc(db, "prospects", id), {
        ...prospect,
        nextActionDate: todayString(d),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  async function deleteProspect(id: string) {
    await withMutation(async () => {
      const { db } = requireSession();
      await deleteDoc(doc(db, "prospects", id));
    });
  }

  async function bulkUpdateStage(ids: string[], stage: string) {
    await withMutation(async () => {
      const { db } = requireSession();
      const now = new Date().toISOString();
      for (const group of chunk(ids, 250)) {
        const batch = writeBatch(db);
        group.forEach((id) => {
          const prospect = findProspect(id);
          batch.set(doc(db, "prospects", id), {
            ...prospect,
            currentStage: stage,
            stageHistory: [
              ...prospect.stageHistory,
              {
                stage,
                timestamp: now,
                note: "Bulk stage update",
              },
            ],
            lastActionDate: now,
            updatedAt: now,
            conversationLog: [
              ...prospect.conversationLog,
              {
                id: createId(),
                timestamp: now,
                type: "stage-change",
                text: `Stage moved to ${stage} · Bulk stage update`,
                link: "",
              },
            ],
          });
        });
        await batch.commit();
      }
    });
  }

  async function replaceAllData(
    nextProspects: Prospect[],
    nextSettings?: UserSettings,
  ) {
    await withMutation(async () => {
      const { db, user: currentUser } = requireSession();
      const existing = await getDocs(
        query(collection(db, "prospects"), where("userId", "==", currentUser.uid)),
      );

      for (const group of chunk(existing.docs, 250)) {
        const batch = writeBatch(db);
        group.forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
      }

      for (const group of chunk(nextProspects, 250)) {
        const batch = writeBatch(db);
        group.forEach((prospect) => {
          batch.set(doc(db, "prospects", prospect.id), {
            ...normalizeProspect(prospect),
            userId: currentUser.uid,
          });
        });
        await batch.commit();
      }

      if (nextSettings) {
        await setDoc(
          doc(db, "userSettings", currentUser.uid),
          { ...normalizeSettings(nextSettings), updatedAt: new Date().toISOString() },
          { merge: true },
        );
      }
    });
  }

  async function clearProspects() {
    await withMutation(async () => {
      const { db, user: currentUser } = requireSession();
      const existing = await getDocs(
        query(collection(db, "prospects"), where("userId", "==", currentUser.uid)),
      );

      for (const group of chunk(existing.docs, 250)) {
        const batch = writeBatch(db);
        group.forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
      }
    });
  }

  const value: OutreachContextValue = {
    prospects,
    settings,
    loading,
    mutating,
    error,
    saveSettings,
    addProspect,
    updateStage,
    addLogEntry,
    updateProspect,
    snoozeProspect,
    deleteProspect,
    bulkUpdateStage,
    replaceAllData,
    clearProspects,
  };

  return (
    <OutreachContext.Provider value={value}>
      {children}
    </OutreachContext.Provider>
  );
}

export function useOutreach() {
  const context = useContext(OutreachContext);
  if (!context) {
    throw new Error("useOutreach must be used inside OutreachProvider.");
  }
  return context;
}
