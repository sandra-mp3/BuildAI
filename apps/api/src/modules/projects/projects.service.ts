/**
 * PROJECTS.SERVICE.TS
 * ---------------------
 * This file holds all the actual logic for managing projects — creating,
 * renaming, deleting, duplicating, and reading them back out of the
 * database (I use Prisma as the tool that talks to PostgreSQL on my
 * behalf; think of it as a translator between JavaScript objects and
 * database rows, so I don't have to hand-write raw SQL everywhere).
 *
 * THE MOST IMPORTANT FUNCTION IN THIS FILE: assertOwnership
 * -------------------------------------------------------------
 * By the time code in this file runs, `FirebaseAuthGuard` (see
 * firebase-auth.guard.ts) has already verified *who* is making the
 * request. But knowing who someone is isn't the same as knowing what
 * they're allowed to touch — that second check, "does this specific
 * project actually belong to this specific person?", is called
 * *authorization*, and it's just as important as authentication.
 *
 * `assertOwnership` is a small helper that every read/update/delete
 * function below calls before doing anything else. It looks up the
 * project, and if the project's `ownerId` doesn't match the id of the
 * person making the request, it throws an error and stops immediately —
 * nothing after that point ever runs. This is what makes it impossible
 * for "User A" to view or modify "User B"'s project just by guessing or
 * editing a project ID in a request, even though both users are otherwise
 * fully logged in and legitimate. I check this on the server, in every
 * relevant function, rather than only hiding the option in the website's
 * interface — hiding a button in the browser doesn't stop someone from
 * sending the underlying request directly.
 *
 * (There's an automated test that permanently checks this exact behavior
 * — see test/authorization.project-access.spec.ts.)
 */

import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Confirms the project exists AND belongs to the person asking, in one
   * step. Every other method in this class calls this first.
   */
  private async assertOwnership(projectId: string, ownerId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });

    // Don't reveal *why* it failed. If I returned a different error for
    // "doesn't exist" vs. "exists but isn't yours," an attacker could use
    // that difference to figure out which project IDs are real — a subtle
    // information leak called an "enumeration" vulnerability.
    if (!project) throw new NotFoundException("Project not found.");
    if (project.ownerId !== ownerId) throw new ForbiddenException("Not your project.");

    return project;
  }

  /** Every project owned by this person, most recently edited first. */
  list(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Creates a brand-new project with a minimal starter file, so someone
   * always lands on *something* real rather than a blank error.
   */
  async create(ownerId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        framework: (dto.framework as any) ?? "NEXT_REACT",
        accentHue: dto.accentHue ?? Math.floor(Math.random() * 360),
        ownerId,
        files: {
          create: [
            {
              path: "app/page.tsx",
              language: "typescript",
              content: `export default function Page() {\n  return <main className="p-8">New project scaffold.</main>;\n}`,
            },
          ],
        },
        versions: {
          create: [{ number: 1, label: "Initial scaffold", description: "Project created.", snapshot: {} }],
        },
      },
    });
    return project;
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto) {
    await this.assertOwnership(id, ownerId);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string) {
    await this.assertOwnership(id, ownerId);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  /** Copies a project's files into a brand-new project owned by the same person. */
  async duplicate(ownerId: string, id: string) {
    const project = await this.assertOwnership(id, ownerId);
    const files = await this.prisma.projectFile.findMany({ where: { projectId: id } });

    return this.prisma.project.create({
      data: {
        name: `${project.name} copy`,
        description: project.description,
        framework: project.framework,
        accentHue: project.accentHue,
        ownerId,
        files: {
          create: files.map((f: { path: string; content: string; language: string }) => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })),
        },
        versions: {
          create: [{ number: 1, label: "Duplicated", description: `Copied from "${project.name}".`, snapshot: {} }],
        },
      },
    });
  }

  async getWithFiles(ownerId: string, id: string) {
    await this.assertOwnership(id, ownerId);
    return this.prisma.project.findUnique({
      where: { id },
      include: { files: true, versions: { orderBy: { number: "desc" } } },
    });
  }
}
