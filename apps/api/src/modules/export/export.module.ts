import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  controllers: [ExportController],
  providers: [ExportService, PrismaService],
})
export class ExportModule {}
