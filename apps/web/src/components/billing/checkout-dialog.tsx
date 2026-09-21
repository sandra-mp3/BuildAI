"use client";

/**
 * CHECKOUT-DIALOG.TSX
 * ---------------------
 * The pop-up that appears after someone picks a plan and clicks
 * "Subscribe." It has two jobs:
 *   1. let the person choose how they want to pay — a card (via Stripe) or
 *      M-Pesa mobile money (via Safaricom's Daraja API) — and
 *   2. actually kick off that specific checkout, and show a clear,
 *      honest result: either it worked, or here's exactly why it didn't.
 *
 * WHY THIS DOESN'T PROCESS ANY PAYMENT DETAILS ITSELF
 * ---------------------------------------------------------
 * Notice there's no credit card form anywhere in this file, and the only
 * personal detail collected here for M-Pesa is a phone number. That's
 * intentional: card numbers are sent straight to Stripe's own hosted
 * payment page (BuildAI's server just asks Stripe to create that page and
 * redirects to it), and M-Pesa payments are approved directly on someone's
 * own phone using their M-Pesa PIN, which BuildAI never sees either. See
 * SECURITY.md for the full reasoning — in short, I never want this app to
 * be a place where a raw card number or PIN passes through my own code.
 */

import { useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { api } from "@/lib/api-client";
import { getIdToken, useAuthStore } from "@/lib/auth";
import type { DisplayPlan } from "@/lib/billing-plans";

type Step = "choose" | "mpesa-phone" | "mpesa-pending" | "unavailable";

/** Turns the low-level errors api-client.ts can throw into one plain-language sentence. */
function explainError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (message === "API_UNREACHABLE") {
    return "BuildAI's payment server isn't running right now. If you're just exploring the front end, this is expected — see the README for how to run the full stack.";
  }
  if (message.includes("STRIPE_NOT_CONFIGURED")) {
    return "Card payments aren't connected yet — the server is missing its Stripe API key.";
  }
  if (message.includes("MPESA_NOT_CONFIGURED")) {
    return "M-Pesa payments aren't connected yet — the server is missing its Daraja API credentials.";
  }
  if (message.toLowerCase().includes("table") || message.toLowerCase().includes("relation") || message.toLowerCase().includes("does not exist")) {
    return "The database isn't set up yet — run `npx prisma migrate dev` in apps/api against the real database, then try again.";
  }
  // Rather than hiding an unrecognized error behind a generic message, show
  // the real one — a specific backend error is far more useful for
  // actually fixing the problem than "something went wrong."
  return message ? `Checkout failed: ${message}` : "Something went wrong starting checkout. Please try again.";
}

export function CheckoutDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: DisplayPlan | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function reset(v: boolean) {
    if (!v) {
      setStep("choose");
      setPhone("");
      setErrorMessage(null);
    }
    onOpenChange(v);
  }

  async function withRealAccount(): Promise<string | null> {
    if (isDemoMode) {
      setErrorMessage("Demo Mode is for exploring only — create a real account to subscribe.");
      setStep("unavailable");
      return null;
    }
    const idToken = await getIdToken();
    if (!idToken) {
      setErrorMessage("Payments need a fully connected account (Firebase must be configured for this deployment).");
      setStep("unavailable");
      return null;
    }
    return idToken;
  }

  async function payWithCard() {
    if (!plan) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const idToken = await withRealAccount();
      if (!idToken) return;
      const { checkoutUrl } = await api.billing.checkoutWithStripe(idToken, plan.id);
      // Stripe's own hosted checkout page — this is where card details are
      // actually entered, never inside BuildAI itself.
      window.location.href = checkoutUrl;
    } catch (err) {
      setErrorMessage(explainError(err));
      setStep("unavailable");
    } finally {
      setLoading(false);
    }
  }

  async function payWithMpesa() {
    if (!plan) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const idToken = await withRealAccount();
      if (!idToken) return;
      await api.billing.checkoutWithMpesa(idToken, plan.id, phone);
      setStep("mpesa-pending");
      toast.message("Check your phone", { description: "Approve the M-Pesa prompt to complete payment." });
    } catch (err) {
      setErrorMessage(explainError(err));
      setStep("unavailable");
    } finally {
      setLoading(false);
    }
  }

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {plan.name} plan — ${plan.priceUsd}
          </DialogTitle>
          {step === "choose" && (
            <DialogDescription className="text-sm text-fg-muted">
              Choose how you&apos;d like to pay.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "choose" && (
          <div className="space-y-2">
            <button
              onClick={payWithCard}
              disabled={loading}
              className="forge-focus-ring flex w-full items-center gap-3 rounded-md border border-border-strong p-3 text-left transition-colors hover:bg-bg-elevated disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4 text-violet" />
              <div>
                <p className="text-sm font-medium">Pay with card</p>
                <p className="text-xs text-fg-subtle">Visa, Mastercard, Amex — via Stripe</p>
              </div>
              {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-fg-subtle" />}
            </button>
            <button
              onClick={() => setStep("mpesa-phone")}
              disabled={loading}
              className="forge-focus-ring flex w-full items-center gap-3 rounded-md border border-border-strong p-3 text-left transition-colors hover:bg-bg-elevated disabled:opacity-50"
            >
              <Smartphone className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm font-medium">Pay with M-Pesa</p>
                <p className="text-xs text-fg-subtle">Approve a prompt sent to your phone</p>
              </div>
            </button>
          </div>
        )}

        {step === "mpesa-phone" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              payWithMpesa();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="mpesa-phone">M-Pesa phone number</Label>
              <Input
                id="mpesa-phone"
                name="mpesa-phone"
                // Browsers remember and auto-suggest previously-typed
                // values for a phone-number-shaped field purely based on
                // the field itself — that's a per-browser/device behavior,
                // completely separate from which BuildAI account is
                // signed in. Without this, someone testing M-Pesa checkout
                // on multiple accounts from the same browser would see an
                // earlier account's number auto-suggested here and could
                // easily mistake it for a real cross-account data leak,
                // when nothing is actually stored or shared between
                // accounts at all — this field's value only ever lives in
                // this dialog's own local state.
                autoComplete="off"
                required
                placeholder="+2547XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-[11px] text-fg-subtle">
                We&apos;ll send a payment prompt straight to this number — enter your M-Pesa PIN there to approve it.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !phone.trim()}>
              {loading ? "Sending prompt…" : "Send payment prompt"}
            </Button>
          </form>
        )}

        {step === "mpesa-pending" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="seam-line mb-4 w-32" />
            <Smartphone className="mb-3 h-6 w-6 text-success" />
            <p className="text-sm font-medium">Check your phone</p>
            <p className="mt-1 text-xs text-fg-muted">
              Approve the M-Pesa prompt on {phone} to finish subscribing. This window can be closed —
              your subscription activates as soon as payment is confirmed.
            </p>
            <p className="mt-3 rounded-md border border-seam/25 bg-seam/5 px-3 py-2 text-[11px] leading-relaxed text-fg">
              Running against Safaricom&apos;s <strong>sandbox</strong> (test) environment? Real STK push
              prompts generally aren&apos;t delivered to an arbitrary personal phone number there — that&apos;s a
              limitation of Safaricom&apos;s sandbox itself, not a bug here. Sandbox is meant for confirming the
              request completes without errors; actually receiving a prompt on a real phone needs
              production Daraja credentials issued after Safaricom&apos;s go-live process for a real
              PayBill/Till number.
            </p>
          </div>
        )}

        {step === "unavailable" && (
          <div className="rounded-md border border-seam/25 bg-seam/5 p-3 text-xs leading-relaxed text-fg">
            {errorMessage}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
