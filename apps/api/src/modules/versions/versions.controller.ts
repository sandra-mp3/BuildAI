import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { VersionsService } from "./versions.service";

@Controller("projects/:projectId/versions")
@UseGuards(FirebaseAuthGuard)
export class VersionsController {
  constructor(private versionsService: VersionsService) {}

  @Get()
  list(@Param("projectId") projectId: string) {
    return this.versionsService.list(projectId);
  }

  @Post(":versionId/restore")
  restore(@Param("projectId") projectId: string, @Param("versionId") versionId: string) {
    return this.versionsService.restore(projectId, versionId);
  }
}
