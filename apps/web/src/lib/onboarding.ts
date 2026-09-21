"use client";

const SEEN_PREFIX = "buildai_tour_seen_";

export function hasSeenTour(uid: string): boolean {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(SEEN_PREFIX + uid) === "1";
}

export function markTourSeen(uid: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SEEN_PREFIX + uid, "1");
}
