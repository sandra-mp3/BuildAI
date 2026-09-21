"use client";

/**
 * PROMPT-LIMIT.TS
 * ------------------
 * BuildAI's free tier includes 10 AI prompts — counted across every
 * project someone has, not per-project, so someone can't dodge the limit
 * by just starting a new project every time. This file is the one place
 * that decision is enforced, used by both the "New project" dialog and the
 * in-workspace chat panel, so the rule can't accidentally drift out of
 * sync between the two.
 *
 * HOW THE CHECK WORKS
 * ----------------------
 * 1. If someone's used fewer than 10 prompts, let them through immediately
 *    and count this one.
 * 2. If they've hit the limit, before blocking them, check whether they
 *    actually have an active paid subscription (via the real backend) —
 *    someone who's already paying shouldn't be capped. If that check
 *    can't be made (demo mode, or no backend reachable), it fails safe by
 *    still enforcing the free limit rather than silently granting
 *    unlimited access.
 * 3. Otherwise, show the paywall and refuse the prompt.
 */

import { useState } from "react";
import { api } from "./api-client";
import { getIdToken, useAuthStore } from "./auth";
import { useBuildStore } from "./store";

export const FREE_PROMPT_LIMIT = 10;

export function usePromptGate() {
  const promptsUsed = useBuildStore((s) => s.promptsUsed);
  const incrementPromptUsage = useBuildStore((s) => s.incrementPromptUsage);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [paywallOpen, setPaywallOpen] = useState(false);

  /** Returns true if the prompt should proceed, false if it was blocked. */
  async function ensureCanPrompt(): Promise<boolean> {
    if (promptsUsed < FREE_PROMPT_LIMIT) {
      incrementPromptUsage();
      return true;
    }

    if (!isDemoMode) {
      try {
        const idToken = await getIdToken();
        if (idToken) {
          const subscription = await api.billing.subscription(idToken);
          if (subscription?.status === "ACTIVE") return true; // Paying subscribers aren't capped.
        }
      } catch {
        // Couldn't reach the backend to check — fall through to enforcing
        // the free limit below rather than assuming they're subscribed.
      }
    }

    setPaywallOpen(true);
    return false;
  }

  return { paywallOpen, setPaywallOpen, ensureCanPrompt, promptsUsed };
}
