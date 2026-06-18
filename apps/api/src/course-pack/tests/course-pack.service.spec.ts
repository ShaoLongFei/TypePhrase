import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createId } from "@paralleldrive/cuid2";

import type { DbType } from "../../global/providers/db.provider";
import { insertCourse, insertCoursePack } from "../../../test/fixture/db";
import { cleanDB, testImportModules } from "../../../test/helper/utils";
import { endDB } from "../../common/db";
import { CourseService } from "../../course/course.service";
import { DB } from "../../global/providers/db.provider";
import { CoursePackService } from "../course-pack.service";

describe("CoursePackService", () => {
  let db: DbType;
  let coursePackService: CoursePackService;
  let courseService: CourseService;

  const fakeCoursePackId = createId();
  const fakeCourseId = createId();
  beforeAll(async () => {
    const testHelper = await setupTesting();
    db = testHelper.db;
    coursePackService = testHelper.coursePackService;
    courseService = testHelper.courseService;
  });

  beforeEach(async () => {
    await cleanDB(db);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanDB(db);
    await endDB();
  });

  describe("findAll", () => {
    it("should return public course packs", async () => {
      await insertCoursePack(db, { creatorId: "admin", shareLevel: "public" });
      await insertCoursePack(db, { creatorId: "user1", shareLevel: "public" });

      const result = await coursePackService.findAll();

      expect(result.length).toBe(2);
    });

    it("should not return private course packs", async () => {
      await insertCoursePack(db, { creatorId: "admin", shareLevel: "public" });
      await insertCoursePack(db, { creatorId: "admin", shareLevel: "public" });
      await insertCoursePack(db, { creatorId: "user2", shareLevel: "private" });

      const result = await coursePackService.findAll();

      expect(result.length).toBe(2);
    });

    it("should not return founder-only course packs", async () => {
      await insertCoursePack(db, { creatorId: "user1", shareLevel: "private" });
      await insertCoursePack(db, { creatorId: "admin", shareLevel: "public" });
      await insertCoursePack(db, { creatorId: "admin", shareLevel: "founder_only" });

      const result = await coursePackService.findAll();

      expect(result.length).toBe(1);
    });
  });

  describe("findOne", () => {
    it("should return a course pack for a valid ID", async () => {
      const coursePackEntity = await insertCoursePack(db);

      const result = await coursePackService.findOne(coursePackEntity.id);

      expect(result).toEqual(coursePackEntity);
    });

    it("should throw NotFoundException for an invalid ID", async () => {
      await expect(coursePackService.findOne(createId())).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOneWithCourses", () => {
    it("should return a public course pack with courses", async () => {
      const coursePackEntity = await insertCoursePack(db, { shareLevel: "public" });
      await insertCourse(db, coursePackEntity.id);

      const result = await coursePackService.findOneWithCourses(coursePackEntity.id);

      expect(result.courses.length).toBe(1);
    });

    it("should throw NotFoundException when course pack is private", async () => {
      const coursePackEntity = await insertCoursePack(db, {
        shareLevel: "private",
        creatorId: "cxr",
      });
      await insertCourse(db, coursePackEntity.id);

      await expect(coursePackService.findOneWithCourses(coursePackEntity.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when course pack ID does not exist", async () => {
      const nonExistentCoursePackId = "non-existent-id";

      await expect(coursePackService.findOneWithCourses(nonExistentCoursePackId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when course pack is private even if it has a creator", async () => {
      const coursePackEntity = await insertCoursePack(db, {
        shareLevel: "private",
        creatorId: "another-user-id",
      });
      await insertCourse(db, coursePackEntity.id);

      await expect(coursePackService.findOneWithCourses(coursePackEntity.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when course pack is founder_only", async () => {
      const coursePackEntity = await insertCoursePack(db, {
        shareLevel: "founder_only",
        creatorId: "another-user-id",
      });
      await insertCourse(db, coursePackEntity.id);

      await expect(coursePackService.findOneWithCourses(coursePackEntity.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findCourse", () => {
    it("should call courseService.find", async () => {
      await coursePackService.findCourse(fakeCoursePackId, fakeCourseId);

      expect(courseService);

      expect(courseService.find).toHaveBeenCalled();
    });
  });

  describe("findNextCourse", () => {
    it("should call courseService.findNext", async () => {
      await coursePackService.findNextCourse(fakeCoursePackId, fakeCourseId);

      expect(courseService.findNext).toHaveBeenCalled();
    });
  });

  describe("completeCourse", () => {
    it("should call courseService.completeCourse", async () => {
      await coursePackService.completeCourse(fakeCoursePackId, fakeCourseId);

      expect(courseService.completeCourse).toHaveBeenCalled();
    });
  });
});

async function setupTesting() {
  const MockCourseService = {
    find: jest.fn(),
    findNext: jest.fn(),
    completeCourse: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    imports: testImportModules,
    providers: [CoursePackService, { provide: CourseService, useValue: MockCourseService }],
  }).compile();

  const courseService = moduleRef.get<CourseService>(CourseService);
  const coursePackService = moduleRef.get<CoursePackService>(CoursePackService);

  return {
    moduleRef,
    courseService,
    coursePackService,
    db: moduleRef.get<DbType>(DB),
  };
}
