import { Controller, Param, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { ExportService } from "./export.service";

@Controller("projects/:projectId/export")
@UseGuards(FirebaseAuthGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post()
  async export(@Param("projectId") projectId: string, @Res() res: Response) {
    const stream = await this.exportService.buildZipStream(projectId);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${projectId}.zip"`);
    stream.pipe(res);
  }
}
