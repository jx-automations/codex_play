"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import { subscribeToSettings, writeSettings } from "@/lib/firestore";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "@/types";

interface UseSettingsResult {
  settings: UserSettings;
  loading: boolean;
  save: (updates: Partial<UserSettings>) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const { user, status } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!user) {
      setSettings(DEFAULT_USER_SETTINGS);
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToSettings(
      db,
      user.uid,
      (data) => {
        setSettings(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [user, status]);

  async function save(updates: Partial<UserSettings>) {
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) return;
    const merged = { ...settings, ...updates };
    setSettings(merged);
    await writeSettings(db, user.uid, merged);
  }

  return { settings, loading, save };
}
