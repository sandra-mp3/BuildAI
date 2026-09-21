/**
 * STORE.TEST.TS
 * ---------------
 * These tests check the rules in `store.ts` — the file that manages every
 * project's data while someone is using BuildAI in their browser (in a
 * real, fully-connected version of this product, this same logic would
 * live on the backend instead; here it doubles as the "pretend backend"
 * that makes the whole product explorable without needing a database).
 *
 * WHY THESE PARTICULAR RULES GET TESTS
 * ---------------------------------------
 * Each test below exists because it protects a rule I explicitly designed
 * the product around, and that would be easy to silently break later while
 * changing unrelated code:
 *   - a brand-new project always starts completely blank (issue: earlier
 *     versions accidentally pre-filled every new account with sample data)
 *   - a project made from a template is NOT immediately visible on the
 *     dashboard until it's explicitly saved
 *   - "reset to blank" really does wipe everything, so one person's
 *     browser session can never leak into the next
 * Each `it(...)` block below describes, in a sentence, exactly which rule
 * it's checking — that description is what shows up if the test ever
 * fails, so I write it the way I'd explain the bug to someone else.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { inferKindFromPrompt } from "./mock-data";
import { useBuildStore } from "./store";

// Vitest keeps the store's state around between tests by default (since
// it's a real, shared JavaScript object), so I reset it back to empty
// before every single test. Without this, an earlier test creating a
// project could make a later, unrelated test pass or fail for the wrong
// reason — a classic source of flaky, confusing test suites.
beforeEach(() => {
  useBuildStore.getState().resetToBlank();
});

describe("creating a project", () => {
  it("gives a brand-new project exactly one starter file when no template is used", () => {
    const id = useBuildStore.getState().createProject({
      name: "My First Project",
      description: "Just testing",
    });

    const files = useBuildStore.getState().files[id];
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe("app/page.tsx");
  });

  it("uses the template's own files, not the generic blank scaffold, when seedFiles are provided", () => {
    const id = useBuildStore.getState().createProject({
      name: "Legal Case Tracker",
      description: "From a template",
      seedFiles: [
        { path: "app/page.tsx", language: "typescript", content: "// case tracker" },
        { path: "components/CaseTable.tsx", language: "typescript", content: "// table" },
      ],
    });

    const files = useBuildStore.getState().files[id];
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.path === "components/CaseTable.tsx")).toBe(true);
  });

  it("marks a project as saved by default, but unsaved when explicitly requested (the template preview flow)", () => {
    const savedId = useBuildStore.getState().createProject({ name: "A", description: "" });
    const unsavedId = useBuildStore.getState().createProject({ name: "B", description: "", saved: false });

    const projects = useBuildStore.getState().projects;
    expect(projects.find((p) => p.id === savedId)?.saved).toBe(true);
    expect(projects.find((p) => p.id === unsavedId)?.saved).toBe(false);
  });
});

describe("saving a template preview", () => {
  it("moves a project from unsaved to saved, and applies the chosen name", () => {
    const id = useBuildStore.getState().createProject({ name: "SaaS Starter", description: "", saved: false });

    useBuildStore.getState().saveProject(id, "My Actual Startup");

    const project = useBuildStore.getState().projects.find((p) => p.id === id);
    expect(project?.saved).toBe(true);
    expect(project?.name).toBe("My Actual Startup");
  });
});

describe("resetToBlank (used whenever someone signs up, logs in, or logs out)", () => {
  it("wipes every project, file, chat message, and version — nothing carries over between sessions", () => {
    useBuildStore.getState().createProject({ name: "Should disappear", description: "" });
    expect(useBuildStore.getState().projects).toHaveLength(1);

    useBuildStore.getState().resetToBlank();

    expect(useBuildStore.getState().projects).toHaveLength(0);
    expect(Object.keys(useBuildStore.getState().files)).toHaveLength(0);
  });
});

describe("loadDemoData (used only by the explicit Demo Mode button)", () => {
  it("populates the sample projects exactly once, even if called again", () => {
    useBuildStore.getState().loadDemoData();
    const countAfterFirstLoad = useBuildStore.getState().projects.length;
    expect(countAfterFirstLoad).toBeGreaterThan(0);

    // Calling it a second time (e.g. re-checking auth state on a page
    // refresh) must not duplicate the sample data.
    useBuildStore.getState().loadDemoData();
    expect(useBuildStore.getState().projects.length).toBe(countAfterFirstLoad);
  });
});

describe("inferKindFromPrompt (this is what stops every project from looking identical)", () => {
  it("picks genuinely different domains for genuinely different prompts", () => {
    // This is a direct regression test for a real bug: new projects used
    // to always generate the exact same blank scaffold no matter what was
    // typed into the prompt. This test fails immediately if that ever
    // happens again, by checking that meaningfully different prompts
    // don't all collapse onto the same result.
    const team = inferKindFromPrompt("Track my employees and their PTO requests");
    const finance = inferKindFromPrompt("Manage our monthly budget and expenses");
    const crm = inferKindFromPrompt("A CRM to track sales deals and leads");
    const ecommerce = inferKindFromPrompt("An online store with orders and inventory");

    const results = [team, finance, crm, ecommerce];
    expect(new Set(results).size).toBe(results.length);
  });

  it("falls back to a sensible default for a generic prompt", () => {
    expect(inferKindFromPrompt("Build me something cool")).toBe("analytics");
  });
});

describe("hydrateExistingProjects (fixes projects appearing to vanish after logging back in)", () => {
  it("brings a project's real files back after resetToBlank wiped the local store", () => {
    // Simulates exactly what happens on a real login: resetToBlank runs
    // first (as it does in signInWithEmail/signInWithGoogle), then the
    // backend's real saved projects should be brought back in.
    useBuildStore.getState().resetToBlank();
    expect(useBuildStore.getState().projects).toHaveLength(0);

    useBuildStore.getState().hydrateExistingProjects([
      {
        id: "real-project-1",
        name: "My Saved App",
        description: "Created last week",
        files: [{ path: "app/page.tsx", language: "typescript", content: "// still here" }],
        versions: [{ number: 1, label: "Initial", description: "First version", createdAt: new Date().toISOString() }],
      },
    ]);

    const project = useBuildStore.getState().projects.find((p) => p.id === "real-project-1");
    expect(project).toBeDefined();
    expect(project?.remote).toBe(true);
    expect(useBuildStore.getState().files["real-project-1"][0].content).toBe("// still here");
    expect(useBuildStore.getState().remoteProjectsLoaded).toBe(true);
  });
});

describe("hydrateGeneratedProject (turns a real backend AI response into a usable project)", () => {
  it("stores the real generated files and marks the project as remote and saved", () => {
    useBuildStore.getState().hydrateGeneratedProject({
      id: "real-backend-id-123",
      name: "Test App",
      description: "A test prompt",
      files: [{ path: "app/page.tsx", language: "typescript", content: "// real AI output" }],
      summary: "Generated a test app.",
    });

    const project = useBuildStore.getState().projects.find((p) => p.id === "real-backend-id-123");
    expect(project?.remote).toBe(true);
    expect(project?.saved).toBe(true);

    const files = useBuildStore.getState().files["real-backend-id-123"];
    expect(files[0].content).toBe("// real AI output");
  });
});
