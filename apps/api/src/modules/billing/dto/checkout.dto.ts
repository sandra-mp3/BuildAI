/**
 * CHECKOUT.DTO.TS
 * -----------------
 * "DTO" stands for Data Transfer Object — it's just a strict description
 * of exactly what a valid request is allowed to look like. NestJS checks
 * every incoming request against these rules automatically (see the
 * ValidationPipe set up in main.ts) before any billing code runs at all.
 *
 * This matters more here than almost anywhere else in the app, because
 * these endpoints deal with real money. I never let the browser tell the
 * server how much to charge — notice there's no "amount" field at all
 * below. Instead, the browser only ever says *which plan* it wants
 * (MONTHLY, QUARTERLY, and so on), and the server looks up that plan's
 * real price itself, from plans.ts, which is the only place a price is
 * allowed to come from. This closes off an entire category of possible
 * abuse: someone tampering with a request to try to pay $1 for a $200
 * plan.
 */

import { IsIn, IsPhoneNumber, IsString } from "class-validator";
import type { PlanId } from "../plans";

const PLAN_IDS: PlanId[] = ["MONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"];

export class CreateStripeCheckoutDto {
  @IsIn(PLAN_IDS)
  plan!: PlanId;
}

export class CreateMpesaCheckoutDto {
  @IsIn(PLAN_IDS)
  plan!: PlanId;

  // Validated as a real Kenyan phone number shape (e.g. +2547XXXXXXXX) up
  // front, so an obviously malformed number never even reaches the Daraja
  // API call.
  @IsString()
  @IsPhoneNumber("KE")
  phoneNumber!: string;
}
