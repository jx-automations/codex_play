"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { getFirebaseDb } from "@/lib/firebase";
import { subscribeToProspects } from "@/lib/firestore";
import { type Prospect } from "@/types";

interface UseProspectsResult {
  prospects: Prospect[];
  loading: boolean;
  error: string | null;
}

export function useProspects(): UseProspectsResult {
  const { user, status } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!user) {
      setProspects([]);
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setError("Firebase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToProspects(
      db,
      user.uid,
      (data) => {
        setProspects(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [user, status]);

  return { prospects, loading, error };
}
