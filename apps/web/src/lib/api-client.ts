/**
 * API-CLIENT.TS
 * ---------------
 * A thin, typed wrapper around the real NestJS backend (`apps/api`). Every
 * function here does the same three things: attach the person's real
 * Firebase login token (if there is one — see `getIdToken()` in auth.ts),
 * send the request, and throw a clear, readable error if anything goes
 * wrong rather than letting a confusing low-level network error bubble up
 * to the interface.
 *
 * WHEN THIS FILE GETS USED VS. THE IN-BROWSER STORE
 * -----------------------------------------------------
 * BuildAI can run two ways: fully standalone with no backend at all (demo
 * mode, or a freshly signed-up account before `apps/api` is even running —
 * everything lives in the in-browser store.ts in that case, purely so the
 * product is explorable with zero setup), or backed by the real API.
 *
 * `create-project-dialog.tsx` and `ai-chat-panel.tsx` both *try* this real
 * API first whenever someone has a genuine, signed-in identity (checked via
 * `getIdToken()`), and only fall back to a locally-simulated result if that
 * real call fails for any reason — no backend running, no database
 * migrated yet, or a real AI provider error. That fallback is what stops a
 * missing backend from being a dead end, while still using real, distinct,
 * prompt-specific AI generation whenever a real backend is actually
 * reachable — which is the whole point of having Groq wired up at all.
 *
 * Billing is the one exception that never has a local fallback path: real
 * money can only ever be handled by a real server that actually talks to
 * Stripe and M-Pesa, so those calls always go through this file.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit, idToken?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // The fetch itself failed — almost always because no backend is
    // actually running at API_URL. This is the expected, normal state
    // whenever someone is just exploring the front end without also
    // running `apps/api` — callers catch this specific message and fall
    // back to a local simulation instead of showing a scary raw error.
    throw new Error("API_UNREACHABLE");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with ${res.status}`);
  }
  return res.json();
}

/**
 * The AI chat-edit endpoint (`/ai/chat/stream`) is a Server-Sent Events
 * (SSE) endpoint — it can push incremental progress updates before sending
 * one final "done" event with the actual result. This client deliberately
 * doesn't consume it incrementally: it just waits for the whole response
 * and picks the final event out of it. That's a simplification (a fully
 * streaming UI could show live progress text as the AI works), but it
 * keeps this client simple while still getting the real, validated result
 * at the end — the workspace's existing "Generating changes…" indicator
 * already covers the waiting experience visually.
 */
function parseSseResult<T>(rawText: string): T {
  const blocks = rawText.split("\n\n").filter(Boolean);
  let doneData: T | null = null;
  let errorMessage: string | null = null;

  for (const block of blocks) {
    const eventLine = block.match(/^event:\s*(\w+)/m);
    const dataLine = block.match(/^data:\s*(.*)$/m);
    if (!eventLine || !dataLine) continue;
    const parsed = JSON.parse(dataLine[1]);
    if (eventLine[1] === "done") doneData = parsed;
    if (eventLine[1] === "error") errorMessage = parsed.message ?? "AI edit failed.";
  }

  if (errorMessage) throw new Error(errorMessage);
  if (!doneData) throw new Error("The AI edit endpoint returned no result.");
  return doneData;
}

interface RemoteProjectFile {
  path: string;
  language: string;
  content: string;
}

interface RemoteProject {
  id: string;
  name: string;
  description: string;
  accentHue?: number;
}

interface RemoteVersion {
  number: number;
  label: string;
  description: string;
  createdAt: string;
}

interface RemoteAppSpec {
  summary: string;
  files: RemoteProjectFile[];
}

interface RemoteChatEdit {
  summary: string;
  filesChanged: RemoteProjectFile[];
  filesDeleted: string[];
}

// Thin, typed wrapper around the NestJS API described in apps/api.
// Every call expects a Firebase ID token; the backend verifies it
// with the Firebase Admin SDK rather than trusting a client-supplied uid.
export const api = {
  projects: {
    list: (idToken: string) => request<RemoteProject[]>("/projects", undefined, idToken),
    create: (idToken: string, body: { name: string; description: string }) =>
      request<{ id: string; name: string; description: string }>(
        "/projects",
        { method: "POST", body: JSON.stringify(body) },
        idToken
      ),
    get: (idToken: string, id: string) =>
      request<{
        id: string;
        name: string;
        description: string;
        accentHue?: number;
        files: RemoteProjectFile[];
        versions: RemoteVersion[];
      }>(`/projects/${id}`, undefined, idToken),
    remove: (idToken: string, id: string) =>
      request(`/projects/${id}`, { method: "DELETE" }, idToken),

    /**
     * Fetches every project a signed-in person owns, *with* its files and
     * versions — the plain `/projects` endpoint alone only returns bare
     * project rows (no files), so this makes one extra request per
     * project to fill those in. Used once per login to rebuild the local
     * store from what's actually saved in the real database — see
     * `hydrateExistingProjects` in store.ts and where this is called from
     * in require-auth.tsx.
     */
    listWithFiles: async (idToken: string) => {
      const projects = await request<RemoteProject[]>("/projects", undefined, idToken);
      return Promise.all(
        projects.map(async (p) => {
          const full = await request<{
            id: string;
            name: string;
            description: string;
            accentHue?: number;
            files: RemoteProjectFile[];
            versions: RemoteVersion[];
          }>(`/projects/${p.id}`, undefined, idToken);
          return full;
        })
      );
    },
  },
  ai: {
    /** Turns a plain-language prompt into a brand-new set of real, AI-generated project files. */
    generate: (idToken: string, body: { projectId: string; prompt: string }) =>
      request<{ spec: RemoteAppSpec }>("/ai/generate", { method: "POST", body: JSON.stringify(body) }, idToken),

    /** Applies a conversational edit request to an existing project's real files. */
    chatEdit: async (idToken: string, body: { projectId: string; message: string }): Promise<RemoteChatEdit> => {
      let res: Response;
      try {
        res = await fetch(`${API_URL}/ai/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify(body),
        });
      } catch {
        throw new Error("API_UNREACHABLE");
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message ?? `Request failed with ${res.status}`);
      }
      const text = await res.text();
      return parseSseResult<RemoteChatEdit>(text);
    },
  },
  versions: {
    list: (idToken: string, projectId: string) =>
      request(`/projects/${projectId}/versions`, undefined, idToken),
  },
  exportProject: (idToken: string, projectId: string) =>
    request<{ url: string }>(`/projects/${projectId}/export`, { method: "POST" }, idToken),

  // Payments — see SECURITY.md and TESTING.md for how these are protected
  // and tested. `plans` is deliberately the one endpoint here that works
  // without any login at all, since pricing should be visible to anyone.
  billing: {
    plans: () => request<{ plans: unknown[] }>("/billing/plans"),
    subscription: (idToken: string) =>
      request<{ status: string; plan: string; currentPeriodEnd: string | null } | null>(
        "/billing/subscription",
        undefined,
        idToken
      ),
    checkoutWithStripe: (idToken: string, plan: string) =>
      request<{ checkoutUrl: string }>(
        "/billing/checkout/stripe",
        { method: "POST", body: JSON.stringify({ plan }) },
        idToken
      ),
    checkoutWithMpesa: (idToken: string, plan: string, phoneNumber: string) =>
      request<{ checkoutRequestId: string }>(
        "/billing/checkout/mpesa",
        { method: "POST", body: JSON.stringify({ plan, phoneNumber }) },
        idToken
      ),
  },
};
