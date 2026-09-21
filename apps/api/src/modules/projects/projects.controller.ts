import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthenticatedRequest, FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
@UseGuards(FirebaseAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.projectsService.list(req.firebaseUser.uid);
  }

  @Get(":id")
  get(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.projectsService.getWithFiles(req.firebaseUser.uid, id);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.firebaseUser.uid, dto);
  }

  @Patch(":id")
  update(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(req.firebaseUser.uid, id, dto);
  }

  @Delete(":id")
  remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.projectsService.remove(req.firebaseUser.uid, id);
  }

  @Post(":id/duplicate")
  duplicate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.projectsService.duplicate(req.firebaseUser.uid, id);
  }
}
