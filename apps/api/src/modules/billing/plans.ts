/**
 * PLANS.TS — the four subscription options BuildAI offers
 * -----------------------------------------------------------
 * I keep the actual prices and plan details in exactly one place on the
 * backend, and treat this file as the "source of truth." The frontend has
 * its own copy (apps/web/src/lib/billing-plans.ts) purely for showing
 * prices instantly without waiting on a network request, but every actual
 * charge is calculated from *this* file, on the server — never from
 * whatever number happens to be sitting in the browser. That distinction
 * matters: if a payment amount were ever decided by the browser instead of
 * the server, someone could tamper with it (the same "never trust the
 * client" idea explained in firebase-auth.guard.ts, just applied to money
 * instead of identity).
 *
 * WHY PRICES ARE STORED AS WHOLE-NUMBER CENTS
 * -----------------------------------------------
 * Computers store the number 19.99 as an approximation, not an exact
 * value — that's just how the underlying number format works. For most
 * things that's harmless, but for money it can eventually cause cents to
 * silently go missing or appear from nowhere after enough calculations.
 * The standard fix (and what Stripe itself expects) is to work entirely in
 * whole-number cents — 2000 instead of $20.00 — and only convert to a
 * dollar sign and decimal point right at the very end, purely for display.
 */

export type PlanId = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";

export interface BillingPlan {
  id: PlanId;
  /** Shown on the pricing page, e.g. "Monthly", "6 Months". */
  name: string;
  /** How many months of access one payment covers. */
  months: number;
  /** Price in whole US cents — see the comment above for why. */
  priceUsdCents: number;
}

export const BILLING_PLANS: BillingPlan[] = [
  { id: "MONTHLY", name: "Monthly", months: 1, priceUsdCents: 2000 },
  { id: "QUARTERLY", name: "3 Months", months: 3, priceUsdCents: 5000 },
  { id: "SEMIANNUAL", name: "6 Months", months: 6, priceUsdCents: 11000 },
  { id: "YEARLY", name: "Yearly", months: 12, priceUsdCents: 20000 },
];

export function findPlan(id: string): BillingPlan | undefined {
  return BILLING_PLANS.find((p) => p.id === id);
}

/**
 * M-Pesa (Kenya's mobile money network) only ever charges in Kenyan
 * Shillings — there's no way to ask it to charge US dollars directly. A
 * real production app would look up a live, current exchange rate at the
 * moment of checkout. I'm using one fixed, clearly-labeled approximate
 * rate instead, because pulling in a live currency-conversion API is a
 * whole additional integration on its own, and I'd rather be upfront
 * about the simplification than quietly pretend this number is precise.
 */
const APPROXIMATE_USD_TO_KES_RATE = 130;

export function priceInKes(plan: BillingPlan): number {
  const usd = plan.priceUsdCents / 100;
  return Math.round(usd * APPROXIMATE_USD_TO_KES_RATE);
}
