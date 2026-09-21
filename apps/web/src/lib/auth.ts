"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { create } from "zustand";
import { firebaseAuth, isFirebaseConfigured } from "./firebase";
import { useBuildStore } from "./store";

interface DemoUser {
  uid: string;
  email: string;
  displayName: string | null;
}

interface AuthState {
  user: User | DemoUser | null;
  loading: boolean;
  initialized: boolean;
  isDemoMode: boolean;
  justSignedUp: boolean;
  setUser: (u: AuthState["user"]) => void;
  setLoading: (v: boolean) => void;
  setInitialized: (v: boolean) => void;
  setDemoMode: (v: boolean) => void;
  setJustSignedUp: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  isDemoMode: false,
  justSignedUp: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setDemoMode: (isDemoMode) => set({ isDemoMode }),
  setJustSignedUp: (justSignedUp) => set({ justSignedUp }),
}));

// Session-only storage. Nothing here is meant to survive a real backend —
// this whole module is a stand-in for Firebase until a real project is
// wired up (see NEXT_PUBLIC_FIREBASE_* in .env.example).
const SESSION_STORAGE_KEY = "buildai_session_user";
const DEMO_MODE_KEY = "buildai_demo_mode";

const DEMO_ACCOUNT: DemoUser = {
  uid: "demo-account",
  email: "demo@account.com",
  displayName: "Demo User",
};

function readSessionUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function writeSessionUser(user: DemoUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  else window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

function writeDemoFlag(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.sessionStorage.setItem(DEMO_MODE_KEY, "1");
  else window.sessionStorage.removeItem(DEMO_MODE_KEY);
}

function readDemoFlag(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_MODE_KEY) === "1";
}

export function initAuthListener() {
  const { setUser, setInitialized, setDemoMode } = useAuthStore.getState();

  // Demo Mode is a local-only pseudo-session that has nothing to do with
  // Firebase — it must be checked first, and it must win, regardless of
  // whether a real Firebase project is connected. Without this check
  // running first, connecting a real Firebase project would cause
  // Firebase's own onAuthStateChanged listener below to fire with "nobody
  // is signed in" (since the demo account was never a real Firebase user)
  // and immediately overwrite the demo session with null — which is
  // exactly the bug that broke Demo Mode once real Firebase credentials
  // were added.
  if (readDemoFlag()) {
    setUser(readSessionUser());
    setDemoMode(true);
    useBuildStore.getState().loadDemoData();
    setInitialized(true);
    return () => {};
  }

  if (isFirebaseConfigured && firebaseAuth) {
    return onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setDemoMode(false);
      setInitialized(true);
    });
  }

  setUser(readSessionUser());
  setDemoMode(false);
  setInitialized(true);
  return () => {};
}

/**
 * Every "fresh account" entry point below (email signup, email login, and
 * Google sign-in when Firebase isn't configured yet) produces a brand-new,
 * uniquely-identified user with no seeded data. None of them are allowed to
 * fall back to the shared demo identity — that identity is reserved
 * exclusively for enterDemoMode(), triggered by the explicit "Demo Mode"
 * button on the login screen.
 */

export async function signUpWithEmail(name: string, email: string, password: string) {
  useAuthStore.getState().setDemoMode(false);
  writeDemoFlag(false);
  useBuildStore.getState().resetToBlank();
  if (isFirebaseConfigured && firebaseAuth) {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(cred.user, { displayName: name });
    useAuthStore.getState().setUser(cred.user);
    useAuthStore.getState().setJustSignedUp(true);
    return;
  }
  const user: DemoUser = { uid: `user-${Date.now()}`, email, displayName: name };
  writeSessionUser(user);
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setJustSignedUp(true);
}

export async function signInWithEmail(email: string, password: string) {
  useAuthStore.getState().setDemoMode(false);
  writeDemoFlag(false);
  useBuildStore.getState().resetToBlank();
  useAuthStore.getState().setJustSignedUp(false);
  if (isFirebaseConfigured && firebaseAuth) {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    useAuthStore.getState().setUser(cred.user);
    return;
  }
  const user: DemoUser = { uid: `user-${Date.now()}`, email, displayName: email.split("@")[0] };
  writeSessionUser(user);
  useAuthStore.getState().setUser(user);
}

/**
 * Without a connected Firebase project there is no real Google account
 * picker to show, so this deliberately refuses to sign anyone in rather
 * than faking success — that would let a person into the app without ever
 * having picked an account, which is exactly the confusing behavior this
 * replaces. The UI surfaces GOOGLE_AUTH_NOT_CONFIGURED as a clear message
 * pointing at Demo Mode or email sign-up instead.
 */
export async function signInWithGoogle() {
  if (isFirebaseConfigured && firebaseAuth) {
    useAuthStore.getState().setDemoMode(false);
    writeDemoFlag(false);
    useBuildStore.getState().resetToBlank();
    const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    useAuthStore.getState().setUser(cred.user);
    useAuthStore.getState().setJustSignedUp(true);
    return;
  }
  throw new Error("GOOGLE_AUTH_NOT_CONFIGURED");
}

export async function resetPassword(email: string) {
  if (isFirebaseConfigured && firebaseAuth) {
    await sendPasswordResetEmail(firebaseAuth, email);
    return;
  }
  await new Promise((r) => setTimeout(r, 600));
}

/**
 * Returns a real, signed Firebase ID token to send along with API
 * requests — or `null` if there isn't one, which is the normal case
 * whenever no real Firebase project is connected yet (demo mode, or a
 * fresh signup before Firebase credentials exist). Anything that needs to
 * call the real backend (billing being the clearest example, since it's
 * the one place that talks to real money) checks for `null` first and
 * shows an honest "this needs a connected backend" message instead of
 * quietly failing or, worse, pretending to work.
 */
export async function getIdToken(): Promise<string | null> {
  if (isFirebaseConfigured && firebaseAuth?.currentUser) {
    return firebaseAuth.currentUser.getIdToken();
  }
  return null;
}

/** The one and only entry point that signs into the shared, seeded demo account. */
export async function enterDemoMode() {
  writeSessionUser(DEMO_ACCOUNT);
  writeDemoFlag(true);
  useAuthStore.getState().setUser(DEMO_ACCOUNT);
  useAuthStore.getState().setDemoMode(true);
  useAuthStore.getState().setJustSignedUp(true);
  useBuildStore.getState().loadDemoData();
}

export async function signOutUser() {
  if (isFirebaseConfigured && firebaseAuth) {
    await signOut(firebaseAuth);
  }
  writeSessionUser(null);
  writeDemoFlag(false);
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setDemoMode(false);
  useBuildStore.getState().resetToBlank();
}
