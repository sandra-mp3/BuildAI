/**
 * BILLING-ERROR-SURFACING.UNIT.SPEC.TS
 * ---------------------------------------
 * WHY THIS TEST EXISTS
 * -----------------------
 * NestJS, by default, only forwards a real error message back to the
 * browser for errors it recognizes as an "HttpException." A plain
 * `throw new Error("STRIPE_NOT_CONFIGURED")` deep inside a service gets
 * silently flattened into a generic, unhelpful "Internal server error" —
 * which is exactly what happened here before this fix: every payment
 * failure looked identical and gave no clue what was actually wrong,
 * whether that was a missing API key or an un-migrated database.
 *
 * This test doesn't call a real Stripe or M-Pesa API — it deliberately
 * fakes `BillingService` to throw the specific error strings those
 * services throw when unconfigured, and checks that the controller
 * translates each one into a proper, informative HttpException rather
 * than letting it fall through as an opaque 500.
 */

import { BadGatewayException, ServiceUnavailableException } from "@nestjs/common";
import { BillingController } from "../src/modules/billing/billing.controller";

function fakeRequest(uid = "user-1") {
  return { firebaseUser: { uid, email: "user@example.com" } } as any;
}

describe("BillingController error surfacing", () => {
  it("turns an unconfigured Stripe error into a clear, specific message", async () => {
    const billingService = { startStripeCheckout: jest.fn().mockRejectedValue(new Error("STRIPE_NOT_CONFIGURED")) };
    const controller = new BillingController(billingService as any, {} as any);

    await expect(
      controller.checkoutWithStripe(fakeRequest(), { plan: "MONTHLY" } as any)
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it("turns an unconfigured M-Pesa error into a clear, specific message", async () => {
    const billingService = { startMpesaCheckout: jest.fn().mockRejectedValue(new Error("MPESA_NOT_CONFIGURED")) };
    const controller = new BillingController(billingService as any, {} as any);

    await expect(
      controller.checkoutWithMpesa(fakeRequest(), { plan: "MONTHLY", phoneNumber: "+254712345678" } as any)
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it("still surfaces an unexpected error (e.g. a database failure) rather than hiding it", async () => {
    const billingService = {
      startStripeCheckout: jest.fn().mockRejectedValue(new Error("The table `public.Subscription` does not exist.")),
    };
    const controller = new BillingController(billingService as any, {} as any);

    await expect(
      controller.checkoutWithStripe(fakeRequest(), { plan: "MONTHLY" } as any)
    ).rejects.toThrow(BadGatewayException);
  });
});
