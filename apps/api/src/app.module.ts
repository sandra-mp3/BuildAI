/**
 * APP.MODULE.TS — the "table of contents" for the whole backend
 * -----------------------------------------------------------------
 * NestJS organizes backend code into "modules" — self-contained folders
 * that each own one area of responsibility (auth, projects, ai, versions,
 * export). This file doesn't contain any business logic itself; its only
 * job is to list every module that should be switched on, plus a couple
 * of app-wide safety features that apply to *all* of them at once.
 *
 * WHY SPLIT THE CODE INTO MODULES AT ALL?
 * ----------------------------------------
 * Each module in `src/modules/` follows the same three-part shape:
 *   controller  → decides which URL/HTTP-method combination triggers what
 *   service     → the actual logic (talking to the database, calling the
 *                 AI provider, etc.)
 *   dto/        → strict "shape" definitions for what a valid request
 *                 looks like
 * Keeping every feature in its own folder, with that same shape every
 * time, means anyone reading this project (including me, coming back to
 * it later) can find "the code that handles X" immediately, and it keeps
 * unrelated features from accidentally reaching into each other's code.
 *
 * RATE LIMITING (ThrottlerModule)
 * --------------------------------
 * AI requests aren't free — every call to the AI generation endpoint costs
 * real money and real server time. Without a limit, a single person (or a
 * bug in a script) could fire off thousands of requests in a loop and run
 * up a large, unexpected bill, or simply slow the service down for
 * everyone else. `ThrottlerModule` puts a ceiling on how many requests
 * any one visitor can make in a given time window; see ai.controller.ts
 * for the (stricter) per-endpoint limit applied specifically to AI calls.
 */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { ExportModule } from "./modules/export/export.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { VersionsModule } from "./modules/versions/versions.module";

@Module({
  imports: [
    // Loads values from the .env file (database URL, API keys, etc.) once,
    // and makes them available anywhere in the app via `ConfigService`
    // without every module needing to load the file itself.
    ConfigModule.forRoot({ isGlobal: true }),

    // Default site-wide limit: 100 requests per 60 seconds per visitor.
    // Individual endpoints (like AI generation) can layer a stricter limit
    // on top of this baseline — see the @Throttle decorator in
    // ai.controller.ts.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    AuthModule,
    ProjectsModule,
    AiModule,
    VersionsModule,
    ExportModule,
    BillingModule,
  ],
  providers: [
    // Registering the throttler as a "global guard" means every single
    // endpoint in the app is automatically rate-limited — nobody has to
    // remember to add it themselves on a new controller.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
