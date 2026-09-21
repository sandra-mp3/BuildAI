/**
 * BILLING-PLANS.UNIT.SPEC.TS
 * ----------------------------
 * Money-related code deserves tests more than almost anything else in this
 * project — a silent mistake here doesn't just look wrong on screen, it
 * charges someone the wrong amount. These tests check the exact numbers
 * the pricing page promises ($20 / $50 / $110 / $200) actually match what
 * `findPlan` and `priceInKes` compute, and that `findPlan` correctly
 * refuses to find a plan that was never actually defined — which matters
 * because that's exactly the check that stops someone from requesting an
 * invented plan id and getting an unexpected result back.
 */

import { describe, expect, it } from "@jest/globals";
import { BILLING_PLANS, findPlan, priceInKes } from "../src/modules/billing/plans";

describe("BILLING_PLANS", () => {
  it("defines exactly the four advertised plans, at the advertised USD prices", () => {
    const prices = Object.fromEntries(BILLING_PLANS.map((p) => [p.id, p.priceUsdCents]));
    expect(prices).toEqual({
      MONTHLY: 2000,
      QUARTERLY: 5000,
      SEMIANNUAL: 11000,
      YEARLY: 20000,
    });
  });

  it("each plan's month count matches its name (e.g. QUARTERLY really means 3 months)", () => {
    expect(findPlan("MONTHLY")?.months).toBe(1);
    expect(findPlan("QUARTERLY")?.months).toBe(3);
    expect(findPlan("SEMIANNUAL")?.months).toBe(6);
    expect(findPlan("YEARLY")?.months).toBe(12);
  });
});

describe("findPlan", () => {
  it("returns undefined for a plan id that doesn't exist, rather than guessing", () => {
    expect(findPlan("NOT_A_REAL_PLAN")).toBeUndefined();
  });
});

describe("priceInKes (the M-Pesa currency conversion)", () => {
  it("converts the $20 monthly plan to a whole-number Kenyan Shilling amount", () => {
    const monthly = findPlan("MONTHLY")!;
    // $20 * 130 (the documented approximate rate in plans.ts) = 2,600 KES.
    expect(priceInKes(monthly)).toBe(2600);
  });

  it("always returns a whole number — M-Pesa can't charge a fraction of a shilling", () => {
    for (const plan of BILLING_PLANS) {
      expect(Number.isInteger(priceInKes(plan))).toBe(true);
    }
  });
});
