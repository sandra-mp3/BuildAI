/**
 * MPESA.SERVICE.TS
 * ------------------
 * This file handles payments through M-Pesa — the mobile money network
 * used very widely across Kenya, where a huge amount of everyday payments
 * happen directly from a phone's SIM card rather than through a bank card.
 * I added this specifically so BuildAI isn't only usable by people who
 * have an international card to put into Stripe.
 *
 * M-Pesa's official developer platform is called "Daraja" ("bridge" in
 * Swahili), and the specific flow I'm using is called "STK Push" (also
 * called "Lipa Na M-Pesa Online"). Here's what actually happens, in plain
 * terms:
 *
 * 1. Someone enters their M-Pesa phone number on the BuildAI pricing page
 *    and picks a plan.
 * 2. My server asks Safaricom (M-Pesa's operator) to push a payment
 *    request directly onto that phone.
 * 3. The person's phone shows a native M-Pesa prompt asking them to enter
 *    their M-Pesa PIN to approve the exact amount.
 * 4. Once they approve it on their phone, Safaricom sends a background
 *    notification (a "callback") to my server confirming whether it
 *    succeeded or failed.
 *
 * Notice my server never touches a card number, a PIN, or any sensitive
 * banking detail at any point — the entire approval happens on the
 * person's own phone, which is the whole point of how STK Push is
 * designed.
 *
 * AN HONEST LIMITATION, WORTH CALLING OUT
 * -------------------------------------------
 * Unlike Stripe, M-Pesa's STK Push is a *one-time* payment request, not a
 * true recurring subscription — Safaricom doesn't offer a way to
 * automatically re-charge someone's phone every month the way a stored
 * card can be automatically re-charged. So for M-Pesa subscribers, BuildAI
 * needs to prompt for a fresh STK Push at the start of each new billing
 * period rather than silently auto-renewing, the same way a lot of
 * real-world Kenyan services (electricity tokens, for example) work. I'm
 * documenting this plainly rather than pretending M-Pesa behaves exactly
 * like a card on file.
 */

import { Injectable } from "@nestjs/common";
import type { BillingPlan } from "./plans";
import { priceInKes } from "./plans";

interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passkey: string;
  callbackUrl: string;
  baseUrl: string;
}

@Injectable()
export class MpesaService {
  private config: MpesaConfig | null;

  constructor() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    const hasEverything = consumerKey && consumerSecret && shortCode && passkey && callbackUrl;
    this.config = hasEverything
      ? {
          consumerKey,
          consumerSecret,
          shortCode,
          passkey,
          callbackUrl,
          // Safaricom provides two environments: "sandbox" for testing
          // with fake money, and the live production API for real
          // payments. Defaulting to sandbox is a deliberate safety choice
          // — it means a misconfigured deployment fails safe (test mode)
          // rather than failing dangerous (accidentally live).
          baseUrl:
            process.env.MPESA_ENV === "production"
              ? "https://api.safaricom.co.ke"
              : "https://sandbox.safaricom.co.ke",
        }
      : null;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Daraja access tokens are short-lived (about an hour) and have to be
   * fetched fresh using HTTP "Basic Auth" — a standard way of sending a
   * username and password (here, the consumer key and secret) directly in
   * the request. I don't cache this token across requests here, to keep
   * the example simple and obviously correct; a production version would
   * cache it until shortly before it expires to avoid one extra network
   * call per payment.
   */
  private async getAccessToken(config: MpesaConfig): Promise<string> {
    const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
    const res = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (!res.ok) throw new Error("Failed to authenticate with the M-Pesa Daraja API.");
    const data = await res.json();
    return data.access_token;
  }

  /** Formats the timestamp Daraja expects: YYYYMMDDHHmmss. */
  private timestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
      d.getMinutes()
    )}${pad(d.getSeconds())}`;
  }

  /**
   * Sends the actual payment prompt to someone's phone. Returns Daraja's
   * `CheckoutRequestID`, which I save on the Subscription record so that
   * when the async callback arrives later, I know exactly which pending
   * payment it belongs to.
   */
  async initiateStkPush(input: { plan: BillingPlan; phoneNumber: string; accountReference: string }) {
    if (!this.config) throw new Error("MPESA_NOT_CONFIGURED");
    const config = this.config;

    const accessToken = await this.getAccessToken(config);
    const timestamp = this.timestamp();
    // Daraja requires a password made by combining the shortcode, the
    // secret passkey, and the current timestamp, then base64-encoding the
    // result — this proves the request really came from a party that
    // knows the secret passkey, similar in spirit to the Stripe webhook
    // signature check.
    const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64");

    const res = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: priceInKes(input.plan),
        PartyA: input.phoneNumber,
        PartyB: config.shortCode,
        PhoneNumber: input.phoneNumber,
        CallBackURL: config.callbackUrl,
        AccountReference: input.accountReference,
        TransactionDesc: `BuildAI ${input.plan.name} plan`,
      }),
    });

    if (!res.ok) throw new Error("M-Pesa declined the payment request.");
    const data = await res.json();
    return { checkoutRequestId: data.CheckoutRequestID as string };
  }
}
