import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { MpesaService } from "./mpesa.service";
import { StripeService } from "./stripe.service";

@Module({
  controllers: [BillingController],
  providers: [BillingService, StripeService, MpesaService, PrismaService],
})
export class BillingModule {}
