"use client";

/**
 * REQUIRE-AUTH.TSX
 * ------------------
 * Wraps every protected page (dashboard, workspace, settings, templates,
 * billing) and redirects to /login if nobody's signed in.
 *
 * THE BUG THIS FILE USED TO HAVE
 * -----------------------------------
 * Projects created through the real backend were being saved correctly
 * the entire time — the database was never the problem. But this
 * component never actually asked the backend "what does this person
 * already have?" on login, so every fresh sign-in started from a
 * completely empty local store, making perfectly-saved projects look like
 * they'd been deleted. The fix is the `useEffect` below: once a real
 * (non-Demo-Mode) person is confirmed signed in, it fetches their real
 * projects — with their real files — and loads them into the local store
 * exactly once per session.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { getIdToken, initAuthListener, useAuthStore } from "@/lib/auth";
import { useBuildStore } from "@/lib/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initialized, isDemoMode } = useAuthStore();
  const remoteProjectsLoaded = useBuildStore((s) => s.remoteProjectsLoaded);
  const hydrateExistingProjects = useBuildStore((s) => s.hydrateExistingProjects);

  useEffect(() => {
    const unsub = initAuthListener();
    return unsub;
  }, []);

  useEffect(() => {
    if (initialized && !user) router.replace("/login");
  }, [initialized, user, router]);

  useEffect(() => {
    if (!initialized || !user || isDemoMode || remoteProjectsLoaded) return;

    let cancelled = false;
    (async () => {
      const idToken = await getIdToken();
      if (!idToken || cancelled) return;
      try {
        const projects = await api.projects.listWithFiles(idToken);
        if (!cancelled) hydrateExistingProjects(projects);
      } catch (err) {
        // Not fatal — this just means the person sees an empty dashboard
        // instead of their real projects (e.g. the backend isn't running,
        // or the database hasn't been migrated yet). Surfaced clearly
        // rather than failing completely silently, since "why did my
        // projects disappear" is exactly the confusing situation this is
        // meant to prevent.
        const message = err instanceof Error ? err.message : "";
        if (message !== "API_UNREACHABLE") {
          toast.error("Couldn't load your saved projects from the server.", { description: message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, user, isDemoMode, remoteProjectsLoaded, hydrateExistingProjects]);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
          <p className="text-xs text-fg-subtle">Loading BuildAI…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
