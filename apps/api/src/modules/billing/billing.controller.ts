/**
 * BILLING.CONTROLLER.TS
 * ------------------------
 * The web-facing endpoints for subscriptions. A few things about this
 * file are specifically worth calling out because payments are a more
 * sensitive area than most of the app:
 *
 * - `GET /billing/plans` and `GET /billing/subscription` don't take a
 *   plan or a price from the caller — plans are read from plans.ts, and
 *   "which subscription is this" always comes from the verified, logged-in
 *   user, never from a value the client could edit.
 *
 * - The two webhook endpoints (`/billing/stripe/webhook` and
 *   `/billing/webhooks/mpesa`) are deliberately the only endpoints in this
 *   whole file *not* protected by `FirebaseAuthGuard`. That's not an
 *   oversight — Stripe and Safaricom's own servers are the ones calling
 *   these endpoints directly, and they obviously don't have a BuildAI
 *   login. Instead, each one is protected its own way: the Stripe webhook
 *   verifies a cryptographic signature (see stripe.service.ts), and the
 *   M-Pesa callback is matched against a checkout request ID that only my
 *   server and Safaricom ever saw.
 *
 * A NOTE ON THE STRIPE ROUTE'S EXACT PATH
 * ------------------------------------------
 * `/billing/stripe/webhook` (rather than the more consistent-looking
 * `/billing/webhooks/stripe`) isn't an accident — it has to match, byte
 * for byte, whatever URL was actually typed into the Stripe Dashboard when
 * the webhook endpoint was registered there. Stripe doesn't discover this
 * URL automatically; a real person configured it once, by hand, on
 * Stripe's side, and every signed webhook Stripe ever sends targets
 * exactly that URL. Renaming the route on my end to look tidier would
 * silently break every future webhook from that already-registered
 * endpoint, so the "ugly but correct" path wins here.
 */

import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthenticatedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { BillingService } from "./billing.service";
import { CreateMpesaCheckoutDto, CreateStripeCheckoutDto } from "./dto/checkout.dto";
import { BILLING_PLANS } from "./plans";
import { StripeService } from "./stripe.service";

@Controller("billing")
export class BillingController {
  // NestJS's built-in exception handling only forwards a real error
  // message to the browser for errors it recognizes as "HttpException"s —
  // a plain `throw new Error("STRIPE_NOT_CONFIGURED")` from deep inside
  // stripe.service.ts or mpesa.service.ts gets silently flattened into a
  // generic, unhelpful "Internal server error" by the time it reaches the
  // response. The two `catch` blocks below exist specifically to translate
  // known, expected failure reasons into a proper HttpException with a
  // real, useful message attached — and to log anything unexpected here,
  // on the server, so it's actually visible while debugging instead of
  // silently disappearing into a generic 500.
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private billingService: BillingService,
    private stripeService: StripeService
  ) {}

  /** Public plan list — no login required, since anyone should be able to see pricing. */
  @Get("plans")
  getPlans() {
    return { plans: BILLING_PLANS };
  }

  @UseGuards(FirebaseAuthGuard)
  @Get("subscription")
  async getSubscription(@Req() req: AuthenticatedRequest) {
    return this.billingService.getSubscription(req.firebaseUser.uid);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("checkout/stripe")
  async checkoutWithStripe(@Req() req: AuthenticatedRequest, @Body() dto: CreateStripeCheckoutDto) {
    const appUrl = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    try {
      return await this.billingService.startStripeCheckout(req.firebaseUser.uid, req.firebaseUser.email ?? "", dto.plan, appUrl);
    } catch (err: any) {
      this.logger.error(`Stripe checkout failed: ${err.message}`, err.stack);
      if (err.message === "STRIPE_NOT_CONFIGURED") {
        throw new ServiceUnavailableException(
          "Card payments aren't connected yet — the server is missing its Stripe API key."
        );
      }
      // Anything else (a database error because migrations haven't run
      // yet, being the most common one during setup) is forwarded as-is
      // rather than hidden, since knowing the real reason is far more
      // useful while getting billing wired up than a generic failure.
      throw new BadGatewayException(err.message || "Stripe checkout failed.");
    }
  }

  @UseGuards(FirebaseAuthGuard)
  @Post("checkout/mpesa")
  async checkoutWithMpesa(@Req() req: AuthenticatedRequest, @Body() dto: CreateMpesaCheckoutDto) {
    try {
      return await this.billingService.startMpesaCheckout(req.firebaseUser.uid, dto.plan, dto.phoneNumber);
    } catch (err: any) {
      this.logger.error(`M-Pesa checkout failed: ${err.message}`, err.stack);
      if (err.message === "MPESA_NOT_CONFIGURED") {
        throw new ServiceUnavailableException(
          "M-Pesa payments aren't connected yet — the server is missing its Daraja API credentials."
        );
      }
      throw new BadGatewayException(err.message || "M-Pesa checkout failed.");
    }
  }

  /**
   * Stripe calls this directly whenever something happens on a
   * subscription — payment succeeded, payment failed, subscription
   * canceled, and so on. `@HttpCode(200)` matters here: Stripe interprets
   * anything other than a 2xx response as "delivery failed" and will keep
   * retrying, so I always acknowledge receipt even if I choose to ignore a
   * particular event type.
   */
  @Post("stripe/webhook")
  @HttpCode(200)
  async stripeWebhook(@Req() req: Request, @Headers("stripe-signature") signature: string) {
    // Note: verifying a Stripe signature requires the *exact, untouched*
    // raw request bytes — NestJS's usual JSON body parsing would already
    // have re-serialized the body by this point and broken the signature
    // check. main.ts configures this one specific route to skip that
    // automatic parsing so `req.body` here is still the original raw
    // buffer Stripe actually sent.
    const event = this.stripeService.constructWebhookEvent(req.body as unknown as Buffer, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const planId = session.metadata?.planId;
      const subscriptionId = session.subscription as string;
      if (planId && session.customer) {
        // Stripe manages the actual renewal date; a real implementation
        // would fetch the subscription object to read its precise
        // `current_period_end` rather than approximating it here.
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        await this.billingService.confirmStripePayment(session.customer, planId, periodEnd, subscriptionId);
      }
    }

    return { received: true };
  }

  /**
   * Safaricom calls this once someone approves (or rejects/ignores) the
   * STK Push prompt on their phone. Like the Stripe webhook, this has no
   * BuildAI login attached to it — the `CheckoutRequestID` inside the
   * payload is what ties it back to the right pending subscription.
   */
  @Post("webhooks/mpesa")
  @HttpCode(200)
  async mpesaWebhook(@Body() body: any) {
    const callback = body?.Body?.stkCallback;
    if (!callback) return { received: true };

    const succeeded = callback.ResultCode === 0;
    const receiptItem = callback.CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber");

    await this.billingService.confirmMpesaPayment(callback.CheckoutRequestID, succeeded, receiptItem?.Value);

    return { received: true };
  }
}
