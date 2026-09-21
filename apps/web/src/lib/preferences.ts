"use client";

import { create } from "zustand";
import type { Framework } from "./types";

interface PreferencesState {
  defaultFramework: Framework;
  reduceMotion: boolean;
  emailNotifications: boolean;
  setDefaultFramework: (f: Framework) => void;
  setReduceMotion: (v: boolean) => void;
  setEmailNotifications: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  defaultFramework: "next-react",
  reduceMotion: false,
  emailNotifications: true,
  setDefaultFramework: (defaultFramework) => set({ defaultFramework }),
  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("reduce-motion", reduceMotion);
    }
  },
  setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
}));
