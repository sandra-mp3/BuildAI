import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ProjectsController } from "../src/modules/projects/projects.controller";
import { ProjectsService } from "../src/modules/projects/projects.service";

describe("ProjectsController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: { list: jest.fn(), create: jest.fn(), remove: jest.fn(), duplicate: jest.fn() },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /projects without a bearer token returns 401", () => {
    return request(app.getHttpServer()).get("/projects").expect(401);
  });

  it("POST /projects without a bearer token returns 401", () => {
    return request(app.getHttpServer())
      .post("/projects")
      .send({ name: "Test", description: "Test project" })
      .expect(401);
  });
});
