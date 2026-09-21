/**
 * AI.CONTROLLER.TS
 * -----------------
 * A "controller" in NestJS is the part of the code that maps an incoming
 * web request (a URL plus an HTTP method, like "POST /ai/generate") to the
 * function that should handle it. This controller owns every endpoint
 * related to talking to the AI: generating a brand-new project from a
 * prompt, applying a chat-requested edit to an existing one, and
 * diagnosing a runtime error. The controller itself stays deliberately
 * thin — it just checks who's asking and hands off to `AiService`, which
 * holds the real logic (see ai.service.ts).
 *
 * TWO SECURITY DECISIONS WORTH EXPLAINING
 * -----------------------------------------
 * 1. `@UseGuards(FirebaseAuthGuard)` — every endpoint in this controller
 *    requires a valid, signed-in identity. Without this, anyone on the
 *    internet could call these endpoints directly (skipping the website
 *    entirely) and generate unlimited AI requests on my account's tab.
 *
 * 2. `@Throttle(...)` — AI calls are the most expensive thing this app
 *    does, both in real money (the AI provider charges per request) and
 *    in server time. The app-wide limit set in app.module.ts (100
 *    requests/minute) is a reasonable general safety net, but it's far
 *    too generous specifically for AI generation. Here I apply a second,
 *    much stricter limit — 10 AI requests per minute per person — directly
 *    on top of the endpoints that actually cost money.
 */

import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { AuthenticatedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { AiService } from "./ai.service";

@Controller("ai")
@UseGuards(FirebaseAuthGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AiController {
  constructor(private aiService: AiService) {}

  /**
   * POST /ai/generate
   * Turns a plain-language prompt into a brand-new, structured application
   * (pages, components, data models, files) — see ai.service.ts for how
   * the AI's response is validated before any of it is trusted or saved.
   */
  @Post("generate")
  async generate(@Req() req: AuthenticatedRequest, @Body() body: { projectId: string; prompt: string }) {
    const spec = await this.aiService.generateApplication(body.projectId, body.prompt);
    return { spec };
  }

  /**
   * POST /ai/chat/stream
   * Backs the "chat with your project" editing panel. It's a Server-Sent
   * Events (SSE) endpoint — a technique that lets the server keep a
   * connection open and push small updates to the browser as they happen,
   * instead of the browser waiting for one single, slow reply. The
   * front-end shows a "generating…" indicator the whole time this is
   * streaming, and can cancel the request early if the person changes
   * their mind.
   */
  @Post("chat/stream")
  async chatStream(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Body() body: { projectId: string; message: string }
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      res.write(`event: status\ndata: ${JSON.stringify({ stage: "interpreting" })}\n\n`);
      const edit = await this.aiService.applyChatEdit(body.projectId, body.message);
      res.write(`event: done\ndata: ${JSON.stringify(edit)}\n\n`);
    } catch (err: any) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  /**
   * POST /ai/diagnose
   * Powers the "AI error detection and recovery" feature: given an error
   * message and the file it happened in, this asks the AI to work out
   * what went wrong and propose a fix, which is then validated the same
   * strict way as a full generation before it's applied.
   */
  @Post("diagnose")
  async diagnose(
    @Req() req: AuthenticatedRequest,
    @Body() body: { projectId: string; errorMessage: string; filePath: string }
  ) {
    return this.aiService.diagnoseAndFix(body.projectId, body.errorMessage, body.filePath);
  }
}
