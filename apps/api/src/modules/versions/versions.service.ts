import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { AppSpec } from "../ai/schemas/app-spec.schema";

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  list(projectId: string) {
    return this.prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { number: "desc" },
    });
  }

  async restore(projectId: string, versionId: string) {
    const version = await this.prisma.projectVersion.findUnique({ where: { id: versionId } });
    if (!version || version.projectId !== projectId) {
      throw new NotFoundException("Version not found.");
    }

    const snapshot = version.snapshot as unknown as AppSpec;
    if (snapshot?.files?.length) {
      await this.prisma.$transaction(
        snapshot.files.map((f) =>
          this.prisma.projectFile.upsert({
            where: { projectId_path: { projectId, path: f.path } },
            update: { content: f.content, language: f.language },
            create: { projectId, path: f.path, content: f.content, language: f.language },
          })
        )
      );
    }

    const versionCount = await this.prisma.projectVersion.count({ where: { projectId } });
    return this.prisma.projectVersion.create({
      data: {
        projectId,
        number: versionCount + 1,
        label: `Restored version ${version.number}`,
        description: `Rolled back to "${version.label}".`,
        snapshot: version.snapshot as any,
      },
    });
  }
}
