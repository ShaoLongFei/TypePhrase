import { Test } from "@nestjs/testing";

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
      ],
    }).compile();

    controller = moduleRef.get(CoursePackController);
  });

  it("completes a course without auth metadata", () => {
    controller.CompleteCourse("pack-id", "course-id");

    expect(controller).toBeDefined();
  });
});
