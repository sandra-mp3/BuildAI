/**
 * BILLING-PLANS.TS
 * ------------------
 * This is a front-end copy of the four subscription plans, used only to
 * draw the pricing page instantly without waiting on a network request.
 * It is **not** the source of truth for what anyone is actually charged —
 * that's `apps/api/src/modules/billing/plans.ts`, on the server, which is
 * the only place a real payment amount is ever calculated from. If these
 * two files ever disagree, the price shown here is just wrong copy to fix
 * — nobody could actually exploit the difference to pay less, because the
 * checkout endpoints only ever accept a plan *name* (e.g. "MONTHLY"), and
 * look the real price up themselves.
 */

export type PlanId = "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";

export interface DisplayPlan {
  id: PlanId;
  name: string;
  months: number;
  priceUsd: number;
  /** A short line explaining the value, shown under the price. */
  blurb: string;
}

export const BILLING_PLANS: DisplayPlan[] = [
  { id: "MONTHLY", name: "Monthly", months: 1, priceUsd: 20, blurb: "Billed every month" },
  { id: "QUARTERLY", name: "3 Months", months: 3, priceUsd: 50, blurb: "Billed every 3 months" },
  { id: "SEMIANNUAL", name: "6 Months", months: 6, priceUsd: 110, blurb: "Billed every 6 months" },
  { id: "YEARLY", name: "Yearly", months: 12, priceUsd: 200, blurb: "Billed once a year — best value" },
];
