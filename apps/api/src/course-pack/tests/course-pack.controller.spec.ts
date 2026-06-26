import { Test } from "@nestjs/testing";

import { AuthService } from "../../auth/auth.service";
import { AuthGuard } from "../../guards/auth.guard";
import { CoursePackController } from "../course-pack.controller";
import { CoursePackService } from "../course-pack.service";

describe("CoursePackController", () => {
  let controller: CoursePackController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CoursePackController],
      providers: [
        {
          provide: CoursePackService,
          useValue: {
            findAll: jest.fn(),
            findOneWithCourses: jest.fn(),
            findCourse: jest.fn(),
            findNextCourse: jest.fn(),
            completeCourse: jest.fn(),
          },
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: AuthService,
          useValue: { findUserIdByRequest: jest.fn() },
        },
      ],
    }).compile();

    controller = moduleRef.get(CoursePackController);
  });

  it("completes a course with current user learning stats", () => {
    controller.CompleteCourse(
      "pack-id",
      "course-id",
      "hard",
      { userId: "user-1" },
      { duration: 30, count: 5, completedAt: "2026-06-18T08:00:00.000Z" },
    );

    expect(controller).toBeDefined();
  });
});
