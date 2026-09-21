import { Module } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { VersionsController } from "./versions.controller";
import { VersionsService } from "./versions.service";

@Module({
  controllers: [VersionsController],
  providers: [VersionsService, PrismaService],
})
export class VersionsModule {}
