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
            completeCourse: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(CoursePackController);
  });

  it("allows anonymous users to complete a course", () => {
    const uncheck = Reflect.getMetadata("uncheck", controller.CompleteCourse);

    expect(uncheck).toBe(true);
  });
});
