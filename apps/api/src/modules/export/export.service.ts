import { Injectable, NotFoundException } from "@nestjs/common";
import archiver from "archiver";
import { PassThrough } from "stream";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async buildZipStream(projectId: string): Promise<PassThrough> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { files: true, envVars: true },
    });
    if (!project) throw new NotFoundException("Project not found.");

    const output = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);

    for (const file of project.files) {
      archive.append(file.content, { name: file.path });
    }

    // Environment variables are written to a local-only file, never
    // committed, and never included in AI prompts sent for generation.
    const envContent = project.envVars.map((e: { key: string; value: string }) => `${e.key}=${e.value}`).join("\n");
    archive.append(envContent || "# no environment variables configured\n", { name: ".env.example" });

    archive.append(
      `# ${project.name}\n\n${project.description}\n\nGenerated with BuildAI.\n`,
      { name: "README.md" }
    );

    archive.finalize();
    return output;
  }
}
