"use client";

/**
 * BILLING PAGE (app/billing/page.tsx)
 * --------------------------------------
 * The pricing page — shows all four subscription options and lets
 * someone start checkout with either Stripe (card) or M-Pesa. This page
 * itself stays deliberately simple: it just displays the four
 * `BILLING_PLANS` and hands off the actual "how does payment work" logic
 * to `CheckoutDialog`. See that file, plus SECURITY.md, for the reasoning
 * behind how payments are handled.
 */

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { TopNav } from "@/components/top-nav";
import { CheckoutDialog } from "@/components/billing/checkout-dialog";
import { PlanCard } from "@/components/billing/plan-card";
import { BILLING_PLANS, type DisplayPlan } from "@/lib/billing-plans";

export default function BillingPage() {
  return (
    <RequireAuth>
      <BillingPageInner />
    </RequireAuth>
  );
}

function BillingPageInner() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<DisplayPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // After a Stripe checkout, Stripe redirects back here with
  // `?checkout=success` or `?checkout=cancelled` — this just shows a small
  // banner reflecting that, it doesn't itself confirm the payment (the
  // webhook in billing.controller.ts is the real source of truth for that).
  const checkoutResult = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutResult) {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, [checkoutResult]);

  function handleSubscribe(plan: DisplayPlan) {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  }

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        {checkoutResult === "success" && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-4 py-2.5 text-sm text-fg">
            <CheckCircle2 className="h-4 w-4 text-success" /> Payment confirmed — your subscription is being activated.
          </div>
        )}
        {checkoutResult === "cancelled" && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-border-strong bg-bg-elevated px-4 py-2.5 text-sm text-fg-muted">
            <XCircle className="h-4 w-4" /> Checkout was cancelled — no payment was made.
          </div>
        )}

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Choose your plan</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Every plan includes the full BuildAI workspace. Pay by card via Stripe, or with M-Pesa
            mobile money.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BILLING_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              highlighted={plan.id === "YEARLY"}
              onSubscribe={() => handleSubscribe(plan)}
            />
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-[11px] text-fg-subtle">
          Prices are in US dollars. M-Pesa payments are charged in Kenyan Shillings at an
          approximate conversion rate. Subscriptions can be cancelled any time from Preferences.
        </p>
      </main>

      <CheckoutDialog plan={selectedPlan} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
