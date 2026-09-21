/**
 * MPESA-CHECKOUT-DTO.UNIT.SPEC.TS
 * ---------------------------------
 * WHY THIS TEST EXISTS
 * -----------------------
 * `class-validator`'s `@IsPhoneNumber()` decorator (used in
 * CreateMpesaCheckoutDto to check the phone number someone enters) quietly
 * depends on a separate package, `libphonenumber-js`, to actually do the
 * validation. That package was missing from this project for a while,
 * which meant every single M-Pesa checkout request failed — not because
 * of anything wrong with the phone number someone typed in, but because
 * the validator itself couldn't run at all.
 *
 * This is a good example of a bug a real request never even gets a chance
 * to surface clearly, because it happens deep inside a validation library
 * before any of my own code runs. A permanent test like this one is the
 * most reliable way to catch that category of mistake automatically,
 * rather than only discovering it by accident while trying to pay for
 * something.
 */

import "reflect-metadata";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CreateMpesaCheckoutDto } from "../src/modules/billing/dto/checkout.dto";

describe("CreateMpesaCheckoutDto", () => {
  it("accepts a valid Kenyan phone number for a real plan", async () => {
    const dto = plainToInstance(CreateMpesaCheckoutDto, {
      plan: "MONTHLY",
      phoneNumber: "+254712345678",
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("rejects a phone number that isn't actually a valid Kenyan number", async () => {
    const dto = plainToInstance(CreateMpesaCheckoutDto, {
      plan: "MONTHLY",
      phoneNumber: "not-a-phone-number",
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects a plan id that isn't one of the four real plans", async () => {
    const dto = plainToInstance(CreateMpesaCheckoutDto, {
      plan: "LIFETIME_FREE_ACCESS",
      phoneNumber: "+254712345678",
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
