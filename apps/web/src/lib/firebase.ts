"use client";

/**
 * FIREBASE.TS — connecting to the real BuildAI Firebase project
 * -------------------------------------------------------------
 * This file sets up three separate Firebase products, each doing a
 * different job:
 *   - Auth: real email/password and Google sign-in (see auth.ts)
 *   - Analytics: anonymous, aggregate usage stats (e.g. "how many people
 *     visited the dashboard today") — never anything that identifies a
 *     specific person by name
 *
 * `isFirebaseConfigured` is the one flag the rest of the app checks before
 * deciding whether to use real Firebase or fall back to the in-memory demo
 * mode described throughout auth.ts. Once the six `NEXT_PUBLIC_FIREBASE_*`
 * values below are set (see .env.local), that flag flips to true
 * automatically and the whole app starts using this real project instead.
 *
 * WHY ANALYTICS NEEDS AN EXTRA SAFETY CHECK THAT AUTH DOESN'T
 * ------------------------------------------------------------------
 * Firebase Analytics can only run in a real browser tab — it doesn't work
 * during Next.js's server-side rendering step, and a handful of browsers
 * and privacy settings (like strict tracking-protection modes) block it
 * outright. Calling `getAnalytics()` in an environment it doesn't support
 * would throw an error and could crash the page. Firebase provides a
 * built-in `isSupported()` check specifically for this, so I always ask
 * first and simply skip Analytics silently if the answer is no — nothing
 * about login, projects, or billing depends on Analytics being present.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { isSupported, getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let analytics: Analytics | undefined;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Analytics is optional and best-effort — a rejected or false result
  // here just means "don't set it up," never an error the rest of the app
  // needs to react to.
  if (firebaseConfig.measurementId) {
    isSupported()
      .then((supported) => {
        if (supported && app) analytics = getAnalytics(app);
      })
      .catch(() => {
        // Analytics genuinely isn't available in this browser — silently
        // move on rather than logging a scary-looking error for something
        // that was never required for the app to work.
      });
  }
}

export { app as firebaseApp, auth as firebaseAuth, analytics as firebaseAnalytics };
