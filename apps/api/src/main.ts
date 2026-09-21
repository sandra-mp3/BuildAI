/**
 * MAIN.TS — the file that actually starts the backend server
 * ------------------------------------------------------------
 * Every NestJS application needs one file that "boots up" the whole thing:
 * it builds the app out of all the feature modules (auth, projects, ai,
 * versions, export — see app.module.ts), then switches on a handful of
 * safety nets before it starts accepting real requests from the internet.
 *
 * I'm calling out the security-related lines specifically, because they're
 * easy to skip past but they matter a lot for a real product:
 *
 *  - helmet(): sets a batch of HTTP response headers that browsers use to
 *    protect people automatically. For example, one of those headers stops
 *    this site from being loaded inside an invisible <iframe> on someone
 *    else's malicious page (a trick called "clickjacking"), and another
 *    stops browsers from trying to guess a file's type in a way attackers
 *    can abuse. I didn't write any of this logic myself — `helmet` is a
 *    well-known, heavily-used library specifically so nobody has to
 *    reinvent these protections themselves and risk getting them wrong.
 *
 *  - ValidationPipe: this automatically checks every incoming request
 *    against the rules I wrote in each feature's `dto` (Data Transfer
 *    Object) files — for example, "a project name must be text and can't
 *    be empty." If a request doesn't match, NestJS rejects it before my
 *    own code ever runs, which closes off a whole category of bugs and
 *    attacks caused by trusting data that was never checked.
 *
 *  - CORS (Cross-Origin Resource Sharing): by default, a web API only
 *    talks to whichever website address is listed in WEB_ORIGIN — normally
 *    the actual BuildAI front-end. This stops a random, unrelated website
 *    from quietly making requests to this API using someone's logged-in
 *    session without their knowledge.
 */

import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { raw } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Turns on the standard set of protective HTTP headers described above.
  app.use(helmet());

  // The Stripe webhook is a special case: verifying that a webhook request
  // genuinely came from Stripe requires checking a cryptographic signature
  // against the *exact, untouched* raw bytes of the request body. NestJS's
  // normal behavior is to parse every request body as JSON automatically,
  // which would re-serialize it slightly differently and break that
  // signature check. So specifically for this one route, and only this
  // route, I switch off JSON parsing and keep the raw bytes instead — see
  // stripe.service.ts's `constructWebhookEvent` for where that matters.
  // This exact path has to match whatever's registered in the Stripe
  // Dashboard's webhook settings — see the comment at the top of
  // billing.controller.ts for why it isn't named more "consistently."
  app.use("/billing/stripe/webhook", raw({ type: "application/json" }));

  // Only the configured front-end origin is allowed to call this API from
  // a browser. `credentials: true` lets it send along the Firebase auth
  // token needed to identify who's making each request.
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip out any request fields that aren't explicitly expected —
      // e.g. if someone tries to sneak an "isAdmin: true" field into a
      // request body, it's silently dropped rather than trusted.
      whitelist: true,
      // Go one step further than just dropping unexpected fields: reject
      // the whole request outright if it contains any. This makes bugs
      // and probing attempts visible instead of silently ignored.
      forbidNonWhitelisted: true,
      // Convert incoming values to the right type (e.g. a URL query param
      // that should be a number) before my code ever sees it.
      transform: true,
    })
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BuildAI API listening on :${port}`);
}

bootstrap();
