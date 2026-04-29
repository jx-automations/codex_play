import { signInWithRedirect, signOut } from "firebase/auth";

import { createGoogleProvider, getFirebaseAuth } from "@/lib/firebase";

export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth could not be initialized.");
  await signInWithRedirect(auth, createGoogleProvider());
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}
