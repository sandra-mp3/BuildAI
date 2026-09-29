import { BadGatewayException, Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { PrismaService } from "../../common/prisma.service";
import { Prisma } from "@prisma/client";
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
Return raw JSON strictly matching the requested schema. Do not enclose the output in Markdown code blocks.`;

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI;
  private model: string;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSy_placeholder_key_for_boot";
    this.client = new OpenAI({
      apiKey,
      baseURL: "[https://generativelanguage.googleapis.com/v1beta/openai/](https://generativelanguage.googleapis.com/v1beta/openai/)",
    });
    this.model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  }

  /** Strips ```json ... ``` formatting if Gemini wraps its response */
  private cleanJsonResponse(raw: string): string {
    return raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

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
      parsed = JSON.parse(this.cleanJsonResponse(raw));
    } catch (err) {
      this.logger.error(`JSON parse failed. Raw response: ${raw}`);
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
        snapshot: spec as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async applyChatEdit(projectId: string, userMessage: string): Promise<ChatEdit> {
    const existingFiles = await this.prisma.projectFile.findMany({ where: { projectId } });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are editing an existing generated application. Given the current files and a change request, " +
            "return only the files that changed and any that should be deleted. Output valid raw JSON.",
        },
        { role: "user", content: JSON.stringify({ files: existingFiles, request: userMessage }) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.cleanJsonResponse(raw));
    } catch {
      throw new BadGatewayException("The model returned malformed JSON during chat edit.");
    }

    const result = ChatEditSchema.safeParse(parsed);
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

  async diagnoseAndFix(projectId: string, errorMessage: string, filePath: string): Promise<ErrorDiagnosis> {
    const file = await this.prisma.projectFile.findFirst({ where: { projectId, path: filePath } });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Diagnose the runtime error in the given file and return a corrected version of that file. Output valid raw JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({ error: errorMessage, file }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.cleanJsonResponse(raw));
    } catch {
      throw new BadGatewayException("The model returned malformed JSON during diagnosis.");
    }

    const result = ErrorDiagnosisSchema.safeParse(parsed);
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
