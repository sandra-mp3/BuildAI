"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { enterDemoMode } from "@/lib/auth";

export function DemoModeCta() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleEnterDemo() {
    await enterDemoMode();
    toast.message("You're in Demo Mode", { description: "Nothing you build here will be saved." });
    router.push("/dashboard");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="forge-focus-ring mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong py-2 text-xs font-medium text-fg-muted transition-colors hover:border-seam/50 hover:text-fg"
      >
        <FlaskConical className="h-3.5 w-3.5" /> Demo Mode — No log in needed
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FlaskConical className="h-4 w-4 text-seam" /> Enter Demo Mode?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-fg-muted">
            Demo Mode lets you explore BuildAI — the dashboard, sample projects, the workspace,
            AI editing, templates — without creating an account.
          </p>
          <p className="mt-3 rounded-md border border-seam/25 bg-seam/5 px-3 py-2 text-xs leading-relaxed text-fg">
            <strong>Nothing is saved.</strong> Any project you create or edit, and any template you
            customize, disappears the moment you leave or refresh — there&apos;s no persistence in
            Demo Mode.
          </p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleEnterDemo}>
              Continue to demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
