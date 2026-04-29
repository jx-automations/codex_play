"use client";

import { getRedirectResult, onAuthStateChanged, signInWithRedirect, signOut, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { createGoogleProvider, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "disabled";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(configured ? "loading" : "disabled");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return undefined;

    const auth = getFirebaseAuth();
    if (!auth) return undefined;

    // Pick up the result after a signInWithRedirect round-trip
    getRedirectResult(auth).catch((redirectError) => {
      setError(redirectError instanceof Error ? redirectError.message : "Sign-in failed.");
      setStatus("unauthenticated");
    });

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setStatus(nextUser ? "authenticated" : "unauthenticated");
      },
      (authError) => {
        setError(authError.message);
        setStatus("unauthenticated");
      },
    );

    return unsubscribe;
  }, [configured]);

  async function signInWithGoogle() {
    if (!configured) {
      setError("Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* values first.");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase Auth could not be initialized.");
      return;
    }

    setError(null);
    try {
      await signInWithRedirect(auth, createGoogleProvider());
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Sign in failed.");
      throw authError;
    }
  }

  async function signOutUser() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  }

  const value: AuthContextValue = {
    user,
    status,
    configured,
    error,
    signInWithGoogle,
    signOutUser,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
