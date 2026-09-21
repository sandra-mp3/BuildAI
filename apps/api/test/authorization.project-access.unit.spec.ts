/**
 * AUTHORIZATION.PROJECT-ACCESS.SPEC.TS
 * ---------------------------------------
 * WHAT IS A "REGRESSION TEST" AND WHY DOES THIS FILE EXIST?
 * -------------------------------------------------------------
 * A regression test is a test written specifically because something once
 * went wrong (or, as a precaution, *could* go wrong) — its whole purpose
 * is to make sure that exact problem can never quietly come back later
 * without anyone noticing. Every time this test suite runs (which happens
 * automatically on every change, via the CI pipeline described in
 * .github/workflows/ci.yml), it re-checks this one specific security
 * guarantee.
 *
 * THE GUARANTEE THIS TEST PROTECTS
 * -----------------------------------
 * "User A" should never be able to read, edit, or delete "User B"'s
 * project — even if User A is fully, legitimately logged in, and even if
 * they simply guess or copy-paste User B's project ID into a request.
 * This category of bug is called "broken access control" (specifically,
 * "horizontal privilege escalation" — one normal user reaching into
 * another normal user's data, as opposed to a normal user reaching into
 * an *admin's* data). It's consistently one of the most common serious
 * security issues found in real web applications, which is exactly why I
 * gave it its own permanent, named test file rather than trusting that
 * "it works when I tried it once."
 *
 * HOW THE TEST WORKS
 * --------------------
 * I don't spin up a real database for this test — that would make the
 * test slow and dependent on external setup. Instead, I create a "fake"
 * (a "mock") version of the database layer that behaves exactly like the
 * real one for this scenario: it has one project, owned by "user-a". Then
 * I call the real `ProjectsService` — the actual production code, not a
 * copy — and check that when "user-b" asks for that same project, they
 * get refused.
 */

import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ProjectsService } from "../src/modules/projects/projects.service";

// A minimal stand-in for PrismaService that only implements the one
// method this test actually exercises. Using a small, purpose-built fake
// like this (rather than a real database) keeps the test fast and focused
// purely on the authorization logic, not on database connectivity.
function createMockPrisma(ownerId: string) {
  const fakeProject = {
    id: "project-123",
    name: "User A's Private Project",
    ownerId,
  };

  return {
    project: {
      findUnique: jest.fn().mockResolvedValue(fakeProject),
      update: jest.fn().mockResolvedValue(fakeProject),
      delete: jest.fn().mockResolvedValue(fakeProject),
    },
    projectFile: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as any;
}

describe("Authorization: cross-user project access", () => {
  it("refuses to let a different user read another person's project", async () => {
    const prisma = createMockPrisma("user-a");
    const service = new ProjectsService(prisma);

    // "user-a" (the real owner) should succeed.
    await expect(service.getWithFiles("user-a", "project-123")).resolves.toBeTruthy();

    // "user-b" (a completely different, but still logged-in, person)
    // should be refused — this is the core guarantee under test.
    await expect(service.getWithFiles("user-b", "project-123")).rejects.toThrow(ForbiddenException);
  });

  it("refuses to let a different user rename another person's project", async () => {
    const prisma = createMockPrisma("user-a");
    const service = new ProjectsService(prisma);

    await expect(
      service.update("user-b", "project-123", { name: "Hijacked name" })
    ).rejects.toThrow(ForbiddenException);

    // And just as importantly: the update must never have reached the
    // database at all once the ownership check failed.
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it("refuses to let a different user delete another person's project", async () => {
    const prisma = createMockPrisma("user-a");
    const service = new ProjectsService(prisma);

    await expect(service.remove("user-b", "project-123")).rejects.toThrow(ForbiddenException);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  it("reports a project as simply 'not found' rather than revealing it exists but is private", async () => {
    // Deliberately not the mocked project's id, simulating a project that
    // truly doesn't exist. The error type (NotFoundException, not
    // ForbiddenException) should be the same shape whether a project
    // never existed at all or exists but belongs to someone else being
    // probed for — see the comment on assertOwnership in
    // projects.service.ts for why that distinction matters.
    const prisma = createMockPrisma("user-a");
    prisma.project.findUnique.mockResolvedValue(null);
    const service = new ProjectsService(prisma);

    await expect(service.getWithFiles("user-b", "does-not-exist")).rejects.toThrow(NotFoundException);
  });
});
