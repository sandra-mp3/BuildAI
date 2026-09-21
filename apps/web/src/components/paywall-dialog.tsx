"use client";

/**
 * PAYWALL-DIALOG.TSX
 * --------------------
 * Shown the moment someone tries to use their 11th AI prompt (see
 * lib/prompt-limit.ts for exactly how that's counted and enforced). This
 * component itself doesn't decide anything — it's purely the "you've hit
 * the limit, here's what to do next" message, with a direct link to the
 * pricing page.
 */

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FREE_PROMPT_LIMIT } from "@/lib/prompt-limit";

export function PaywallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-violet" /> You&apos;ve used your {FREE_PROMPT_LIMIT} free prompts
          </DialogTitle>
          <DialogDescription className="text-sm text-fg-muted">
            That limit applies across all of your projects combined, not per project. Subscribe to keep
            generating and editing with AI.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Link href="/billing" className="flex-1">
            <Button className="w-full">View plans</Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
