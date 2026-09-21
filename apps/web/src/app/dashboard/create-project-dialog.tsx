"use client";

/**
 * CREATE-PROJECT-DIALOG.TSX
 * ---------------------------
 * This is where "describe an app, get a real project" actually happens.
 *
 * THE BUG THIS FILE USED TO HAVE
 * -----------------------------------
 * For a while, clicking "Generate project" never actually asked an AI for
 * anything — it just created the exact same one-line blank scaffold file
 * every single time, completely ignoring what was typed into the prompt.
 * The real AI generation pipeline (Groq, validated with Zod, in
 * `apps/api`) was fully built and working — it just was never being
 * *called* from here.
 *
 * HOW IT WORKS NOW
 * ------------------
 * Three steps, only when someone has a genuine signed-in identity (not
 * Demo Mode):
 *   1. Create a real, empty project row on the real backend.
 *   2. Ask the real AI (Groq) to generate that project's actual files from
 *      the prompt.
 *   3. Pull the result into the local store so the rest of the app (the
 *      workspace, the file explorer, and so on) can display it exactly
 *      like any other project.
 *
 * If any of that fails — no backend running, database not migrated yet,
 * Demo Mode, or a real AI error — this falls back to a *local* simulation
 * instead of just breaking. That fallback isn't the same lazy placeholder
 * as before, either: it picks a starter file set that actually matches
 * keywords in the prompt (see `inferKindFromPrompt` in mock-data.ts), so
 * even the offline fallback produces meaningfully different projects for
 * different requests.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { PaywallDialog } from "@/components/paywall-dialog";
import { api } from "@/lib/api-client";
import { getIdToken, useAuthStore } from "@/lib/auth";
import { filesForKind, inferKindFromPrompt } from "@/lib/mock-data";
import { usePromptGate } from "@/lib/prompt-limit";
import { useBuildStore } from "@/lib/store";

const EXAMPLES = [
  "Build an inventory management dashboard for a small business.",
  "A CRM to track deals and contacts for a five-person sales team.",
  "A portfolio site with a case-study grid and a contact form.",
];

const STAGES = ["Interpreting your request", "Drafting the spec", "Validating structure", "Writing project files"];

function deriveName(prompt: string) {
  const name = prompt.split(" ").slice(0, 4).join(" ").replace(/[^\w\s]/g, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const createProject = useBuildStore((s) => s.createProject);
  const hydrateGeneratedProject = useBuildStore((s) => s.hydrateGeneratedProject);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const { paywallOpen, setPaywallOpen, ensureCanPrompt } = usePromptGate();

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState(0);

  function finishAndNavigate(id: string) {
    setGenerating(false);
    onOpenChange(false);
    setPrompt("");
    setStage(0);
    router.push(`/project/${id}`);
  }

  /** The offline/fallback path — still prompt-aware, see mock-data.ts. */
  function generateLocally() {
    const kind = inferKindFromPrompt(prompt);
    const name = deriveName(prompt);
    const id = createProject({
      name,
      description: prompt,
      previewKind: kind,
      seedFiles: filesForKind(kind, name),
    });
    finishAndNavigate(id);
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;

    const allowed = await ensureCanPrompt();
    if (!allowed) return;

    setGenerating(true);
    setStage(0);

    const idToken = isDemoMode ? null : await getIdToken();

    if (idToken) {
      try {
        const name = deriveName(prompt);
        const created = await api.projects.create(idToken, { name, description: prompt });
        setStage(1);
        const { spec } = await api.ai.generate(idToken, { projectId: created.id, prompt });
        setStage(3);
        hydrateGeneratedProject({
          id: created.id,
          name: created.name || name,
          description: prompt,
          files: spec.files,
          summary: spec.summary,
        });
        finishAndNavigate(created.id);
        return;
      } catch (err) {
        // Fall through to the local simulation below rather than leaving
        // the dialog stuck — but always say so. Silently switching to
        // fallback data without any visible explanation is exactly what
        // made it look like "typing my own prompt doesn't work": the real
        // AI was never actually being called, and the local fallback's
        // guesses only happened to look right for a few example prompts.
        const message = err instanceof Error ? err.message : "";
        toast.error(
          message === "API_UNREACHABLE"
            ? "Can't reach the BuildAI API — using a local preview instead of real AI generation. Make sure apps/api is running."
            : `Real AI generation failed (${message}) — using a local preview instead.`
        );
      }
    }

    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, 400));
    }
    generateLocally();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !generating && onOpenChange(v)}>
        <DialogContent className="max-w-lg">
          {!generating ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-violet" /> New project
                </DialogTitle>
                <DialogDescription className="text-sm text-fg-muted">
                  Describe the application you want. BuildAI turns it into pages, components, and data models.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                autoFocus
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Build an inventory management dashboard for a small business."
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setPrompt(ex)}
                    className="forge-focus-ring rounded-full border border-border px-2.5 py-1 text-[11px] text-fg-muted transition-colors hover:border-violet/40 hover:text-fg"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <Button type="button" onClick={handleGenerate} disabled={!prompt.trim()} className="mt-5 w-full">
                Generate project
              </Button>
              <p className="mt-2 text-center text-[11px] text-fg-subtle">Tip: ⌘/Ctrl + Enter also submits.</p>
            </>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="seam-line mb-6 w-32" />
              <Loader2 className="mb-4 h-6 w-6 animate-spin text-violet" />
              <p className="text-sm font-medium">{STAGES[stage]}…</p>
              <p className="mt-1 text-xs text-fg-subtle">This usually takes a few seconds.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} />
    </>
  );
}
