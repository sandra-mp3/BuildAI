"use client";

import { create } from "zustand";
import { MOCK_CHAT, MOCK_FILES, MOCK_PROJECTS, MOCK_VERSIONS } from "./mock-data";
import type { ChatMessage, PreviewKind, Project, ProjectFile, ProjectVersion } from "./types";

interface BuildState {
  projects: Project[];
  files: Record<string, ProjectFile[]>;
  chat: Record<string, ChatMessage[]>;
  versions: Record<string, ProjectVersion[]>;
  activeFileId: Record<string, string | undefined>;
  generating: Record<string, boolean>;

  createProject: (input: {
    name: string;
    description: string;
    templateHue?: number;
    previewKind?: PreviewKind;
    seedFiles?: Omit<ProjectFile, "id">[];
    saved?: boolean;
  }) => string;
  renameProject: (id: string, name: string) => void;
  updateProjectDescription: (id: string, description: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => string;
  saveProject: (id: string, name: string) => void;

  setActiveFile: (projectId: string, fileId: string) => void;
  updateFileContent: (projectId: string, fileId: string, content: string) => void;
  createFile: (projectId: string, path: string) => void;

  sendChatMessage: (projectId: string, content: string) => void;
  cancelGeneration: (projectId: string) => void;
  regenerate: (projectId: string) => void;

  // Used specifically when a real backend call succeeds — see
  // create-project-dialog.tsx and ai-chat-panel.tsx for how these are
  // paired with api-client.ts. Kept separate from the local-simulation
  // logic above (createProject/sendChatMessage) rather than merged
  // together, so the well-tested local fallback path can't accidentally
  // be broken while wiring up real AI calls.
  hydrateGeneratedProject: (input: {
    id: string;
    name: string;
    description: string;
    files: Omit<ProjectFile, "id">[];
    summary: string;
  }) => void;
  beginRealChatEdit: (projectId: string, content: string) => { userMsgId: string; assistantId: string };
  finishRealChatEdit: (
    projectId: string,
    assistantId: string,
    edit: { summary: string; filesChanged: Omit<ProjectFile, "id">[]; filesDeleted: string[] }
  ) => void;
  failRealChatEdit: (projectId: string, userMsgId: string, assistantId: string) => void;

  // Pulls a signed-in person's *real* projects back out of the actual
  // database and into this in-browser store — this is the piece that was
  // missing before: projects created via the real backend were being
  // saved correctly the whole time, they just were never fetched back on
  // the next login, making it look like they'd been deleted.
  remoteProjectsLoaded: boolean;
  hydrateExistingProjects: (
    list: {
      id: string;
      name: string;
      description: string;
      accentHue?: number;
      files: Omit<ProjectFile, "id">[];
      versions?: { number: number; label: string; description: string; createdAt: string }[];
    }[]
  ) => void;

  restoreVersion: (projectId: string, versionId: string) => void;

  // A running count of AI prompts used across every project — not
  // per-project — because the free-tier limit (see lib/prompt-limit.ts)
  // applies account-wide. Reset whenever someone signs in/out/up, exactly
  // like every other piece of per-account state in this store.
  promptsUsed: number;
  incrementPromptUsage: () => void;

  demoDataLoaded: boolean;
  loadDemoData: () => void;
  resetToBlank: () => void;
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Curated hue family matching the brand palette (dusty rose, army green,
// warm gold, burgundy, success green) — deliberately excludes purple.
const ACCENT_HUES = [340, 90, 42, 12, 150];
function randomAccentHue() {
  return ACCENT_HUES[Math.floor(Math.random() * ACCENT_HUES.length)];
}

function languageFromPath(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".json")) return "json";
  return "typescript";
}

// New accounts — including a fresh Google sign-in before Firebase is wired
// up — always start completely blank. The sample projects only ever appear
// inside the dedicated, clearly-labeled Demo Mode session.
export const useBuildStore = create<BuildState>((set, get) => ({
  projects: [],
  files: {},
  chat: {},
  versions: {},
  activeFileId: {},
  generating: {},
  demoDataLoaded: false,
  remoteProjectsLoaded: false,
  promptsUsed: 0,

  incrementPromptUsage: () => set((s) => ({ promptsUsed: s.promptsUsed + 1 })),

  loadDemoData: () => {
    if (get().demoDataLoaded) return;
    set({
      projects: MOCK_PROJECTS,
      files: MOCK_FILES,
      chat: MOCK_CHAT,
      versions: MOCK_VERSIONS,
      demoDataLoaded: true,
    });
  },

  resetToBlank: () =>
    set({
      projects: [],
      files: {},
      chat: {},
      versions: {},
      activeFileId: {},
      generating: {},
      demoDataLoaded: false,
      remoteProjectsLoaded: false,
      promptsUsed: 0,
    }),

  createProject: ({ name, description, templateHue, previewKind, seedFiles, saved }) => {
    const id = newId("proj");
    const project: Project = {
      id,
      name,
      description: description || "Generated with BuildAI.",
      framework: "next-react",
      accentHue: templateHue ?? randomAccentHue(),
      previewKind: previewKind ?? "analytics",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "ready",
      saved: saved ?? true,
      remote: false,
    };
    const initialFiles: ProjectFile[] = seedFiles?.length
      ? seedFiles.map((f) => ({ ...f, id: newId("f") }))
      : [
          {
            id: newId("f"),
            path: "app/page.tsx",
            language: "typescript",
            content: `export default function Page() {\n  return <main className="p-8">New project scaffold.</main>;\n}`,
          },
        ];
    set((s) => ({
      projects: [project, ...s.projects],
      files: { ...s.files, [id]: initialFiles },
      chat: { ...s.chat, [id]: [] },
      versions: {
        ...s.versions,
        [id]: [
          {
            id: newId("v"),
            number: 1,
            label: "Initial scaffold",
            description: "Project created.",
            createdAt: new Date().toISOString(),
            fileCount: initialFiles.length,
          },
        ],
      },
    }));
    return id;
  },

  renameProject: (id, name) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)),
    })),

  updateProjectDescription: (id, description) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, description, updatedAt: new Date().toISOString() } : p)),
    })),

  saveProject: (id, name) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, saved: true, updatedAt: new Date().toISOString() } : p
      ),
    })),

  deleteProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
    })),

  duplicateProject: (id) => {
    const source = get().projects.find((p) => p.id === id);
    if (!source) return id;
    const newProjectId = newId("proj");
    const duplicated: Project = {
      ...source,
      id: newProjectId,
      name: `${source.name} copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({
      projects: [duplicated, ...s.projects],
      files: { ...s.files, [newProjectId]: [...(s.files[id] ?? [])] },
      chat: { ...s.chat, [newProjectId]: [] },
      versions: { ...s.versions, [newProjectId]: [...(s.versions[id] ?? [])] },
    }));
    return newProjectId;
  },

  setActiveFile: (projectId, fileId) =>
    set((s) => ({ activeFileId: { ...s.activeFileId, [projectId]: fileId } })),

  updateFileContent: (projectId, fileId, content) =>
    set((s) => ({
      files: {
        ...s.files,
        [projectId]: (s.files[projectId] ?? []).map((f) => (f.id === fileId ? { ...f, content } : f)),
      },
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, updatedAt: new Date().toISOString() } : p)),
    })),

  createFile: (projectId, path) =>
    set((s) => ({
      files: {
        ...s.files,
        [projectId]: [
          ...(s.files[projectId] ?? []),
          { id: newId("f"), path, language: languageFromPath(path), content: "" },
        ],
      },
    })),

  sendChatMessage: (projectId, content) => {
    const userMsg: ChatMessage = {
      id: newId("c"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "done",
    };
    const assistantId = newId("c");
    set((s) => ({
      chat: {
        ...s.chat,
        [projectId]: [
          ...(s.chat[projectId] ?? []),
          userMsg,
          { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString(), status: "streaming" },
        ],
      },
      generating: { ...s.generating, [projectId]: true },
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: "generating" } : p)),
    }));

    const fullReply = `Updated the project based on: "${content}". Modified 2 files and refreshed the preview.`;
    let i = 0;
    const interval = setInterval(() => {
      if (!get().generating[projectId]) {
        clearInterval(interval);
        return;
      }
      i += 3;
      const partial = fullReply.slice(0, i);
      set((s) => ({
        chat: {
          ...s.chat,
          [projectId]: (s.chat[projectId] ?? []).map((m) =>
            m.id === assistantId ? { ...m, content: partial } : m
          ),
        },
      }));
      if (i >= fullReply.length) {
        clearInterval(interval);
        set((s) => ({
          chat: {
            ...s.chat,
            [projectId]: (s.chat[projectId] ?? []).map((m) =>
              m.id === assistantId ? { ...m, status: "done" } : m
            ),
          },
          generating: { ...s.generating, [projectId]: false },
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, status: "ready", updatedAt: new Date().toISOString() } : p
          ),
          versions: {
            ...s.versions,
            [projectId]: [
              ...(s.versions[projectId] ?? []),
              {
                id: newId("v"),
                number: (s.versions[projectId]?.length ?? 0) + 1,
                label: content.length > 40 ? content.slice(0, 40) + "…" : content,
                description: fullReply,
                createdAt: new Date().toISOString(),
                fileCount: s.files[projectId]?.length ?? 0,
              },
            ],
          },
        }));
      }
    }, 40);
  },

  cancelGeneration: (projectId) =>
    set((s) => ({
      generating: { ...s.generating, [projectId]: false },
      chat: {
        ...s.chat,
        [projectId]: (s.chat[projectId] ?? []).map((m) =>
          m.status === "streaming" ? { ...m, status: "cancelled" } : m
        ),
      },
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: "ready" } : p)),
    })),

  regenerate: (projectId) => {
    const history = get().chat[projectId] ?? [];
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    if (lastUser) get().sendChatMessage(projectId, lastUser.content);
  },

  hydrateGeneratedProject: ({ id, name, description, files, summary }) => {
    const projectFiles: ProjectFile[] = files.map((f) => ({ ...f, id: newId("f") }));
    const project: Project = {
      id,
      name,
      description,
      framework: "next-react",
      accentHue: randomAccentHue(),
      // "custom" — see live-preview.tsx's renderCustom for why a real,
      // unpredictable AI generation gets an honest placeholder instead of
      // one of the fixed domain mockups used for demo data and templates.
      previewKind: "custom",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "ready",
      saved: true,
      remote: true,
    };
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== id)],
      files: { ...s.files, [id]: projectFiles },
      chat: {
        ...s.chat,
        [id]: [{ id: newId("c"), role: "assistant", content: summary, createdAt: new Date().toISOString(), status: "done" }],
      },
      versions: {
        ...s.versions,
        [id]: [
          {
            id: newId("v"),
            number: 1,
            label: "Generated application",
            description: summary,
            createdAt: new Date().toISOString(),
            fileCount: projectFiles.length,
          },
        ],
      },
    }));
  },

  beginRealChatEdit: (projectId, content) => {
    const userMsgId = newId("c");
    const assistantId = newId("c");
    set((s) => ({
      chat: {
        ...s.chat,
        [projectId]: [
          ...(s.chat[projectId] ?? []),
          { id: userMsgId, role: "user", content, createdAt: new Date().toISOString(), status: "done" },
          { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString(), status: "streaming" },
        ],
      },
      generating: { ...s.generating, [projectId]: true },
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: "generating" } : p)),
    }));
    return { userMsgId, assistantId };
  },

  finishRealChatEdit: (projectId, assistantId, edit) => {
    set((s) => {
      const existing = s.files[projectId] ?? [];
      const byPath = new Map(existing.map((f) => [f.path, f]));
      for (const f of edit.filesChanged) {
        const prev = byPath.get(f.path);
        byPath.set(f.path, { id: prev?.id ?? newId("f"), path: f.path, language: f.language, content: f.content });
      }
      for (const path of edit.filesDeleted) byPath.delete(path);
      const newFiles = Array.from(byPath.values());

      return {
        files: { ...s.files, [projectId]: newFiles },
        chat: {
          ...s.chat,
          [projectId]: (s.chat[projectId] ?? []).map((m) =>
            m.id === assistantId ? { ...m, content: edit.summary, status: "done" } : m
          ),
        },
        generating: { ...s.generating, [projectId]: false },
        projects: s.projects.map((p) =>
          p.id === projectId ? { ...p, status: "ready", updatedAt: new Date().toISOString() } : p
        ),
        versions: {
          ...s.versions,
          [projectId]: [
            ...(s.versions[projectId] ?? []),
            {
              id: newId("v"),
              number: (s.versions[projectId]?.length ?? 0) + 1,
              label: edit.summary.length > 40 ? edit.summary.slice(0, 40) + "…" : edit.summary,
              description: edit.summary,
              createdAt: new Date().toISOString(),
              fileCount: newFiles.length,
            },
          ],
        },
      };
    });
  },

  failRealChatEdit: (projectId, userMsgId, assistantId) =>
    set((s) => ({
      // Remove the placeholder pair entirely rather than leaving a broken
      // "streaming forever" bubble — the caller falls back to
      // sendChatMessage's local simulation immediately after this, which
      // adds its own clean user/assistant pair.
      chat: { ...s.chat, [projectId]: (s.chat[projectId] ?? []).filter((m) => m.id !== userMsgId && m.id !== assistantId) },
      generating: { ...s.generating, [projectId]: false },
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, status: "ready" } : p)),
    })),

  hydrateExistingProjects: (list) =>
    set((s) => {
      const now = new Date().toISOString();
      const newProjects: Project[] = list.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        framework: "next-react",
        accentHue: p.accentHue ?? randomAccentHue(),
        previewKind: "custom",
        createdAt: now,
        updatedAt: now,
        status: "ready",
        saved: true,
        remote: true,
      }));

      const files = { ...s.files };
      const versions = { ...s.versions };
      // Chat history isn't fetched back from the backend on login (that
      // endpoint doesn't return conversation history yet) — a returning
      // project's real files and versions come back intact, but its
      // conversation starts empty rather than being lost outright, which
      // is what happened before this fix existed at all.
      for (const p of list) {
        files[p.id] = p.files.map((f) => ({ ...f, id: newId("f") }));
        versions[p.id] = (p.versions ?? []).map((v) => ({
          id: newId("v"),
          number: v.number,
          label: v.label,
          description: v.description,
          createdAt: v.createdAt,
          fileCount: p.files.length,
        }));
      }

      // Existing local (non-remote) entries are left alone — this only
      // ever runs right after resetToBlank on a real login, so in
      // practice there's nothing else here yet, but writing it as a merge
      // rather than an overwrite keeps this safe if that ever changes.
      const existingIds = new Set(newProjects.map((p) => p.id));
      return {
        projects: [...newProjects, ...s.projects.filter((p) => !existingIds.has(p.id))],
        files,
        versions,
        remoteProjectsLoaded: true,
      };
    }),

  restoreVersion: (projectId, versionId) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, updatedAt: new Date().toISOString() } : p
      ),
      versions: s.versions,
    })),
}));
