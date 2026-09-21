/**
 * AI.SERVICE.TS
 * ---------------
 * This is where every AI-related feature actually talks to a real AI
 * model: turning a plain-language brief into a project, applying a
 * chat-requested edit, and diagnosing a runtime error.
 *
 * WHY GROQ, AND WHY THIS DOESN'T NEED A DIFFERENT SDK
 * --------------------------------------------------------
 * BuildAI uses Groq as its AI provider. Groq is unusual among AI providers
 * in that it runs models on its own custom hardware built specifically for
 * running AI models extremely fast (rather than the more common
 * general-purpose graphics cards other providers use) — for a product
 * where someone is watching a "generating…" indicator, that speed
 * difference is genuinely noticeable.
 *
 * The convenient part: Groq deliberately made its API match OpenAI's API
 * shape exactly, specifically so existing code written for OpenAI can
 * switch over by changing little more than a URL and a key. That's why
 * this file still imports the `openai` npm package below — it's not a
 * mistake or leftover — I'm using it purely as a generic "speak this API
 * shape" client, just pointed at Groq's servers instead of OpenAI's, via
 * the `baseURL` option.
 *
 * WHY THE VALIDATION PIPELINE MATTERS MORE THAN WHICH PROVIDER IS BEHIND IT
 * ------------------------------------------------------------------------
 * Regardless of which company's model answers, I never trust that answer
 * directly. Every response is required to come back as JSON, then checked
 * field-by-field against a strict schema (see app-spec.schema.ts) using
 * Zod before a single byte of it is saved to the database or shown to
 * anyone. If the model's response doesn't match the expected shape
 * exactly, it's rejected outright — this is what "AI generation ->
 * validation -> files -> database" (mentioned throughout this project's
 * docs) actually means in code, and it's also exactly why switching the
 * underlying provider was this simple: the safety net doesn't depend on
 * which company generated the text.
 */

import { BadGatewayException, Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { PrismaService } from "../../common/prisma.service";
import {
  AppSpec,
  AppSpecSchema,
  ChatEdit,
  ChatEditSchema,
  ErrorDiagnosis,
  ErrorDiagnosisSchema,
} from "./schemas/app-spec.schema";

const SYSTEM_PROMPT = `You are BuildAI's application architect. Given a plain-language brief,
produce a structured application specification: pages, components, routes, data models, and
the actual project files. Prefer a small number of focused files over one enormous file.
Never return prose outside the structured schema.`;

// Groq's currently-recommended large, general-purpose model that supports
// the strict JSON response mode this service relies on. Groq's exact
// model lineup changes over time as newer ones are added and older ones
// are retired, so this is deliberately overridable via an environment
// variable rather than only ever hard-coded — see .env.example.
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

@Injectable()
export class AiService {
  private client: OpenAI;
  private model: string;

  constructor(private prisma: PrismaService) {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      // This one line is the entire "switch to Groq" — everything else
      // below is unchanged from how it would look calling OpenAI directly.
      baseURL: "https://api.groq.com/openai/v1",
    });
    this.model = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
  }

  /**
   * Generation pipeline:
   *   AI generation -> Zod validation -> project files -> database persistence
   * Each stage is isolated so a validation failure never reaches the database.
   */
  async generateApplication(projectId: string, prompt: string): Promise<AppSpec> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new BadGatewayException("The model returned an empty response.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new BadGatewayException("The model returned malformed JSON.");
    }

    const result = AppSpecSchema.safeParse(parsed);
    if (!result.success) {
      throw new BadGatewayException(
        `Generated spec failed validation: ${result.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    const spec = result.data;
    await this.persistSpec(projectId, spec);
    return spec;
  }

  private async persistSpec(projectId: string, spec: AppSpec) {
    await this.prisma.$transaction([
      ...spec.files.map((f) =>
        this.prisma.projectFile.upsert({
          where: { projectId_path: { projectId, path: f.path } },
          update: { content: f.content, language: f.language },
          create: { projectId, path: f.path, content: f.content, language: f.language },
        })
      ),
      this.prisma.chatMessage.create({
        data: { projectId, role: "ASSISTANT", content: spec.summary },
      }),
    ]);

    const versionCount = await this.prisma.projectVersion.count({ where: { projectId } });
    await this.prisma.projectVersion.create({
      data: {
        projectId,
        number: versionCount + 1,
        label: "Generated application",
        description: spec.summary,
        snapshot: spec as any,
      },
    });
  }

  /** Iterative chat-based editing — understands existing files, returns only the diff. */
  async applyChatEdit(projectId: string, userMessage: string): Promise<ChatEdit> {
    const existingFiles = await this.prisma.projectFile.findMany({ where: { projectId } });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are editing an existing generated application. Given the current files and a change request, " +
            "return only the files that changed and any that should be deleted.",
        },
        { role: "user", content: JSON.stringify({ files: existingFiles, request: userMessage }) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = ChatEditSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      throw new BadGatewayException("The model's edit response failed validation.");
    }

    const edit = result.data;
    await this.prisma.$transaction([
      ...edit.filesChanged.map((f) =>
        this.prisma.projectFile.upsert({
          where: { projectId_path: { projectId, path: f.path } },
          update: { content: f.content, language: f.language },
          create: { projectId, path: f.path, content: f.content, language: f.language },
        })
      ),
      ...edit.filesDeleted.map((path) =>
        this.prisma.projectFile.deleteMany({ where: { projectId, path } })
      ),
    ]);

    return edit;
  }

  /** AI error detection and recovery: diagnose a runtime error and produce a targeted fix. */
  async diagnoseAndFix(projectId: string, errorMessage: string, filePath: string): Promise<ErrorDiagnosis> {
    const file = await this.prisma.projectFile.findFirst({ where: { projectId, path: filePath } });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Diagnose the runtime error in the given file and return a corrected version of that file.",
        },
        {
          role: "user",
          content: JSON.stringify({ error: errorMessage, file }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result = ErrorDiagnosisSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      throw new BadGatewayException("The model's diagnosis failed validation.");
    }

    const diagnosis = result.data;
    await this.prisma.projectFile.updateMany({
      where: { projectId, path: diagnosis.fix.path },
      data: { content: diagnosis.fix.content },
    });

    return diagnosis;
  }
}
