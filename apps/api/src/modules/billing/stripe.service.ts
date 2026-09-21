/**
 * STRIPE.SERVICE.TS
 * -------------------
 * Everything to do with talking to Stripe (a payment processor that
 * handles card payments) lives in this one file. I use Stripe rather than
 * building my own way to accept card payments for the same reason I use
 * Firebase for logins: handling raw card numbers directly is both a huge
 * legal/compliance burden (PCI-DSS) and a serious security risk if done
 * incorrectly, and Stripe is a well-established service built specifically
 * to take that risk away from smaller companies and individual developers.
 * My server never sees or stores anyone's actual card number at any point.
 *
 * HOW A PAYMENT ACTUALLY HAPPENS, STEP BY STEP
 * ------------------------------------------------
 * 1. Someone picks a plan on the BuildAI pricing page and clicks "Pay with
 *    card."
 * 2. My server (this file) asks Stripe to create a "Checkout Session" —
 *    basically a pre-built, secure payment page that Stripe hosts, not me.
 * 3. The person is sent to that Stripe-hosted page to actually enter their
 *    card details. Because it's Stripe's own page, their card number never
 *    passes through my server at all.
 * 4. Once they pay, Stripe redirects them back to BuildAI, AND separately
 *    sends a "webhook" — a background notification straight to my server
 *    confirming the payment succeeded (see billing.controller.ts's
 *    `stripeWebhook` endpoint). I rely on that webhook, not the redirect,
 *    as the actual proof of payment — the redirect alone could in theory
 *    be faked by just visiting the URL directly, but a webhook is signed
 *    by Stripe in a way only Stripe's real servers can produce.
 */

import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import type { BillingPlan } from "./plans";

@Injectable()
export class StripeService {
  private client: Stripe | null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    // If no key is configured, I deliberately leave `client` as null rather
    // than letting the Stripe SDK throw a confusing low-level error later.
    // See `isConfigured()` below — every caller checks this first and
    // surfaces one clear, honest message instead.
    this.client = secretKey ? new Stripe(secretKey) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Converts one of BuildAI's four plans into the shape Stripe's
   * "recurring price" needs. Stripe only understands intervals of
   * day/week/month/year, so a 3-month or 6-month plan is expressed as
   * "every 3 months" / "every 6 months" using `interval_count`, rather
   * than needing a special case in Stripe itself.
   */
  private recurringForPlan(plan: BillingPlan): Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring {
    if (plan.months === 12) return { interval: "year", interval_count: 1 };
    return { interval: "month", interval_count: plan.months };
  }

  async createCheckoutSession(input: {
    plan: BillingPlan;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    existingStripeCustomerId?: string | null;
  }): Promise<{ url: string; customerId: string }> {
    if (!this.client) {
      throw new Error("STRIPE_NOT_CONFIGURED");
    }

    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      customer: input.existingStripeCustomerId ?? undefined,
      customer_email: input.existingStripeCustomerId ? undefined : input.userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.plan.priceUsdCents,
            recurring: this.recurringForPlan(input.plan),
            product_data: { name: `BuildAI — ${input.plan.name} plan` },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      // Carries the plan id through to the webhook, so when Stripe later
      // confirms payment, my server knows which plan was actually bought
      // without needing to re-derive it from the price alone.
      metadata: { planId: input.plan.id },
    });

    if (!session.url || !session.customer) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return { url: session.url, customerId: session.customer as string };
  }

  /**
   * Confirms an incoming webhook request genuinely came from Stripe and
   * hasn't been tampered with, using the signing secret only Stripe and my
   * server know. Without this check, anyone who discovered the webhook URL
   * could send a fake "payment succeeded" request and grant themselves a
   * free subscription.
   */
  constructWebhookEvent(rawBody: Buffer, signatureHeader: string): Stripe.Event {
    if (!this.client) throw new Error("STRIPE_NOT_CONFIGURED");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_NOT_CONFIGURED");
    return this.client.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret);
  }
}
