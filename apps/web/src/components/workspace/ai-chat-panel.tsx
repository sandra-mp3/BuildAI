"use client";

/**
 * AI-CHAT-PANEL.TSX
 * -------------------
 * The conversational editing panel inside a project's workspace. Like
 * create-project-dialog.tsx, this now actually calls the real backend
 * (Groq, via `/ai/chat/stream`) when it can, and only falls back to a
 * local simulation when it can't.
 *
 * ONE IMPORTANT DIFFERENCE FROM CREATE-PROJECT-DIALOG
 * ---------------------------------------------------------
 * A real chat-edit call only makes sense for a project that actually
 * exists as a row in the real database — sending one for a locally-
 * simulated, template, or demo project (which the backend has never heard
 * of) would just fail. `project.remote` (set only when a project was
 * created through the real `/ai/generate` flow — see
 * hydrateGeneratedProject in store.ts) is the flag that decides whether
 * this component even attempts the real call at all.
 */

import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PaywallDialog } from "@/components/paywall-dialog";
import { api } from "@/lib/api-client";
import { getIdToken, useAuthStore } from "@/lib/auth";
import { usePromptGate } from "@/lib/prompt-limit";
import { useBuildStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AiChatPanel({ projectId }: { projectId: string }) {
  const project = useBuildStore((s) => s.projects.find((p) => p.id === projectId));
  const messages = useBuildStore((s) => s.chat[projectId] ?? []);
  const generating = useBuildStore((s) => s.generating[projectId]);
  const sendChatMessage = useBuildStore((s) => s.sendChatMessage);
  const cancelGeneration = useBuildStore((s) => s.cancelGeneration);
  const regenerate = useBuildStore((s) => s.regenerate);
  const beginRealChatEdit = useBuildStore((s) => s.beginRealChatEdit);
  const finishRealChatEdit = useBuildStore((s) => s.finishRealChatEdit);
  const failRealChatEdit = useBuildStore((s) => s.failRealChatEdit);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const { paywallOpen, setPaywallOpen, ensureCanPrompt } = usePromptGate();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, generating]);

  async function handleSend() {
    if (!input.trim() || generating) return;
    const content = input.trim();
    setInput("");

    const allowed = await ensureCanPrompt();
    if (!allowed) return;

    if (project?.remote && !isDemoMode) {
      const idToken = await getIdToken();
      if (idToken) {
        const { userMsgId, assistantId } = beginRealChatEdit(projectId, content);
        try {
          const edit = await api.ai.chatEdit(idToken, { projectId, message: content });
          finishRealChatEdit(projectId, assistantId, edit);
          return;
        } catch (err) {
          failRealChatEdit(projectId, userMsgId, assistantId);
          const message = err instanceof Error ? err.message : "";
          toast.error(
            message === "API_UNREACHABLE"
              ? "Can't reach the BuildAI API — simulating this edit instead of a real AI change."
              : `Real AI edit failed (${message}) — simulating this edit instead.`
          );
          // Falls through to the local simulation below.
        }
      }
    }

    sendChatMessage(projectId, content);
  }

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-violet" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">AI editing</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="text-xs text-fg-subtle">
            Ask for changes — &quot;make the dashboard darker&quot; or &quot;add a revenue chart&quot; — and BuildAI will update your project files.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                m.role === "user" ? "bg-violet text-violet-fg" : "border border-border bg-bg-elevated text-fg"
              )}
            >
              {m.content || (m.status === "streaming" && <TypingDots />)}
              {m.status === "cancelled" && <span className="italic text-fg-subtle"> — cancelled</span>}
            </div>
            {m.role === "assistant" && m.status === "done" && (
              <button
                onClick={() => regenerate(projectId)}
                className="forge-focus-ring flex items-center gap-1 rounded-sm px-1 text-[10px] text-fg-subtle hover:text-fg"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Regenerate
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3">
        {generating && (
          <div className="mb-2 flex items-center justify-between rounded-md border border-seam/25 bg-seam/5 px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-seam" /> Generating changes…
            </span>
            <button onClick={() => cancelGeneration(projectId)} className="forge-focus-ring flex items-center gap-1 rounded-sm text-[11px] text-fg-muted hover:text-error">
              <Square className="h-2.5 w-2.5" /> Cancel
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            disabled={generating}
            placeholder="Describe a change…"
            className="forge-focus-ring flex-1 resize-none rounded-md border border-border bg-bg-elevated px-2.5 py-2 text-xs placeholder:text-fg-subtle disabled:opacity-50"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || generating} aria-label="Send message">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} />
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg-subtle" />
    </span>
  );
}
