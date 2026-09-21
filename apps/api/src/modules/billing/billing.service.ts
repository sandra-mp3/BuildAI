/**
 * BILLING.SERVICE.TS
 * --------------------
 * This is the "orchestrator" for payments — it doesn't talk to Stripe or
 * M-Pesa directly itself (that's what stripe.service.ts and
 * mpesa.service.ts are for), and it doesn't handle HTTP requests directly
 * either (that's billing.controller.ts). Its job sits in between: given a
 * person and a plan, figure out which payment provider to use, ask that
 * provider's service to actually start the payment, and later, once a
 * provider confirms the payment really happened, update the person's
 * subscription record in the database.
 *
 * Splitting things this way — controller → service → provider-specific
 * service — means if I ever wanted to add a third payment provider, I'd
 * only need to add one new small file and a couple of lines here, without
 * touching how Stripe or M-Pesa already work.
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { findPlan, type PlanId } from "./plans";
import { StripeService } from "./stripe.service";
import { MpesaService } from "./mpesa.service";

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private mpesa: MpesaService
  ) {}

  /** The current subscription status for someone's account, or null if they've never subscribed. */
  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  async startStripeCheckout(userId: string, userEmail: string, planId: PlanId, appUrl: string) {
    const plan = findPlan(planId);
    if (!plan) throw new NotFoundException("Unknown plan.");

    const existing = await this.prisma.subscription.findUnique({ where: { userId } });

    const { url, customerId } = await this.stripe.createCheckoutSession({
      plan,
      userEmail,
      successUrl: `${appUrl}/billing?checkout=success`,
      cancelUrl: `${appUrl}/billing?checkout=cancelled`,
      existingStripeCustomerId: existing?.stripeCustomerId,
    });

    // I record the subscription as INCOMPLETE the moment checkout starts,
    // rather than waiting for the webhook to create it from scratch. This
    // means if someone abandons the Stripe payment page halfway through,
    // there's still an honest, visible record that a checkout was
    // attempted, instead of it vanishing without a trace.
    await this.prisma.subscription.upsert({
      where: { userId },
      update: { plan: planId, provider: "STRIPE", status: "INCOMPLETE", stripeCustomerId: customerId },
      create: { userId, plan: planId, provider: "STRIPE", status: "INCOMPLETE", stripeCustomerId: customerId },
    });

    return { checkoutUrl: url };
  }

  async startMpesaCheckout(userId: string, planId: PlanId, phoneNumber: string) {
    const plan = findPlan(planId);
    if (!plan) throw new NotFoundException("Unknown plan.");

    const { checkoutRequestId } = await this.mpesa.initiateStkPush({
      plan,
      phoneNumber,
      accountReference: userId,
    });

    await this.prisma.subscription.upsert({
      where: { userId },
      update: { plan: planId, provider: "MPESA", status: "INCOMPLETE", mpesaCheckoutRequestId: checkoutRequestId },
      create: { userId, plan: planId, provider: "MPESA", status: "INCOMPLETE", mpesaCheckoutRequestId: checkoutRequestId },
    });

    return { checkoutRequestId };
  }

  /** Called once Stripe's webhook confirms a subscription payment actually succeeded. */
  async confirmStripePayment(stripeCustomerId: string, planId: PlanId, currentPeriodEnd: Date, stripeSubscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({ where: { stripeCustomerId } });
    if (!subscription) return; // Nothing to reconcile against — logged upstream in the controller.

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", plan: planId, currentPeriodEnd, stripeSubscriptionId },
    });

    await this.recordPaymentEvent(subscription.userId, planId, "STRIPE", "succeeded", stripeSubscriptionId);
  }

  /** Called once M-Pesa's callback confirms an STK Push was approved (or rejected) on someone's phone. */
  async confirmMpesaPayment(checkoutRequestId: string, succeeded: boolean, receiptNumber?: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { mpesaCheckoutRequestId: checkoutRequestId },
    });
    if (!subscription) return;

    if (!succeeded) {
      await this.prisma.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELED" } });
      await this.recordPaymentEvent(subscription.userId, subscription.plan, "MPESA", "failed");
      return;
    }

    const plan = findPlan(subscription.plan)!;
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + plan.months);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", currentPeriodEnd },
    });

    await this.recordPaymentEvent(subscription.userId, subscription.plan, "MPESA", "succeeded", receiptNumber);
  }

  private async recordPaymentEvent(
    userId: string,
    planId: PlanId,
    provider: "STRIPE" | "MPESA",
    status: "succeeded" | "failed",
    providerReference?: string
  ) {
    const plan = findPlan(planId)!;
    await this.prisma.paymentEvent.create({
      data: {
        userId,
        plan: planId,
        provider,
        amountCents: plan.priceUsdCents,
        currency: provider === "STRIPE" ? "USD" : "KES",
        status,
        providerReference,
      },
    });
  }
}
