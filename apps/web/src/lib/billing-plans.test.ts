/**
 * BILLING-PLANS.TEST.TS
 * -----------------------
 * These plans are only used to draw the pricing page instantly (see the
 * comment at the top of billing-plans.ts for why the real prices live on
 * the server, not here). Even so, it's worth a quick permanent check that
 * this display copy hasn't drifted out of sync with what's actually
 * advertised — if someone changed a price here without updating the
 * matching value in `apps/api/src/modules/billing/plans.ts`, the pricing
 * page would show a number that isn't what people actually get charged,
 * which is a confusing (and bad-faith-looking) bug worth catching early.
 */
import { describe, expect, it } from "vitest";
import { BILLING_PLANS } from "./billing-plans";

describe("BILLING_PLANS (frontend display copy)", () => {
  it("shows exactly the four advertised plans, in a sensible increasing price order", () => {
    const prices = BILLING_PLANS.map((p) => p.priceUsd);
    expect(prices).toEqual([20, 50, 110, 200]);
  });

  it("gives every plan a unique id — the checkout dialog relies on this to know which plan was picked", () => {
    const ids = BILLING_PLANS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps each plan's month count consistent with its name", () => {
    const byId = Object.fromEntries(BILLING_PLANS.map((p) => [p.id, p.months]));
    expect(byId).toEqual({ MONTHLY: 1, QUARTERLY: 3, SEMIANNUAL: 6, YEARLY: 12 });
  });
});
