import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createId } from "@paralleldrive/cuid2";

import type { DbType } from "../../global/providers/db.provider";
import { insertCourse, insertCoursePack } from "../../../test/fixture/db";
import { cleanDB, testImportModules } from "../../../test/helper/utils";
import { endDB } from "../../common/db";
import { CourseHistoryService } from "../../course-history/course-history.service";
import { CourseService } from "../../course/course.service";
import { DB } from "../../global/providers/db.provider";
import { UserCourseProgressService } from "../../user-course-progress/user-course-progress.service";
import { UserLearnRecordService } from "../../user-learn-record/user-learn-record.service";
import { UserLearningActivityService } from "../../user-learning-activity/user-learning-activity.service";
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
    it("should return all course packs", async () => {
      await insertCoursePack(db, { title: "零基础" });
      await insertCoursePack(db, { title: "进阶句子" });

      const result = await coursePackService.findAll();

      expect(result.length).toBe(2);
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
    it("should return a course pack with courses", async () => {
      const coursePackEntity = await insertCoursePack(db);
      await insertCourse(db, coursePackEntity.id);

      const result = await coursePackService.findOneWithCourses(coursePackEntity.id);

      expect(result.courses.length).toBe(1);
    });

    it("should throw NotFoundException when course pack ID does not exist", async () => {
      const nonExistentCoursePackId = "non-existent-id";

      await expect(coursePackService.findOneWithCourses(nonExistentCoursePackId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findCourse", () => {
    it("should call courseService.find with difficulty", async () => {
      testMocks.courseService.find.mockResolvedValue({
        id: fakeCourseId,
        coursePackId: fakeCoursePackId,
        practiceItems: [],
      });

      await coursePackService.findCourse(fakeCoursePackId, fakeCourseId, "user-1", "hard");

      expect(courseService.find).toHaveBeenCalledWith(
        fakeCoursePackId,
        fakeCourseId,
        "user-1",
        "hard",
      );
      expect(testMocks.userCourseProgressService.findPracticeIndex).toHaveBeenCalledWith(
        "user-1",
        fakeCoursePackId,
        fakeCourseId,
        "hard",
      );

      expect(testMocks.courseHistoryService.findCompletionCount).toHaveBeenCalledWith(
        "user-1",
        fakeCoursePackId,
        fakeCourseId,
        "hard",
      );
    });
  });

  describe("findNextCourse", () => {
    it("should call courseService.findNext", async () => {
      await coursePackService.findNextCourse(fakeCoursePackId, fakeCourseId);

      expect(courseService.findNext).toHaveBeenCalled();
    });
  });

  describe("completeCourse", () => {
    it("should record user learning data when completing a course", async () => {
      const userId = "user-1";
      const completedAt = new Date("2026-06-18T08:00:00.000Z");

      await coursePackService.completeCourse(fakeCoursePackId, fakeCourseId, userId, {
        duration: 30,
        count: 5,
        completedAt,
        difficulty: "hard",
      });

      expect(courseService.completeCourse).toHaveBeenCalled();
      expect(testMocks.courseHistoryService.upsert).toHaveBeenCalledWith(
        userId,
        fakeCoursePackId,
        fakeCourseId,
        "hard",
      );
      expect(testMocks.userLearningActivityService.upsertActivity).toHaveBeenCalledWith(
        userId,
        completedAt,
        "course_learning_time",
        30,
        fakeCourseId,
        { coursePackId: fakeCoursePackId, difficulty: "hard" },
      );
      expect(testMocks.userLearnRecordService.increment).toHaveBeenCalledWith(
        userId,
        completedAt,
        5,
      );
    });
  });
});

let testMocks: {
  courseService: jest.Mocked<Pick<CourseService, "find" | "findNext" | "completeCourse">>;
  courseHistoryService: jest.Mocked<Pick<CourseHistoryService, "findCompletionCount" | "upsert">>;
  userCourseProgressService: jest.Mocked<Pick<UserCourseProgressService, "findPracticeIndex">>;
  userLearningActivityService: jest.Mocked<Pick<UserLearningActivityService, "upsertActivity">>;
  userLearnRecordService: jest.Mocked<Pick<UserLearnRecordService, "increment">>;
};

async function setupTesting() {
  const MockCourseService = {
    find: jest.fn(),
    findNext: jest.fn(),
    completeCourse: jest.fn(),
  };
  const MockCourseHistoryService = {
    findCompletionCount: jest.fn().mockResolvedValue(0),
    upsert: jest.fn(),
  };
  const MockUserCourseProgressService = {
    findPracticeIndex: jest.fn().mockResolvedValue(0),
  };
  const MockUserLearningActivityService = {
    upsertActivity: jest.fn(),
  };
  const MockUserLearnRecordService = {
    increment: jest.fn(),
  };
  testMocks = {
    courseService: MockCourseService,
    courseHistoryService: MockCourseHistoryService,
    userCourseProgressService: MockUserCourseProgressService,
    userLearningActivityService: MockUserLearningActivityService,
    userLearnRecordService: MockUserLearnRecordService,
  };

  const moduleRef = await Test.createTestingModule({
    imports: testImportModules,
    providers: [
      CoursePackService,
      { provide: CourseService, useValue: MockCourseService },
      { provide: CourseHistoryService, useValue: MockCourseHistoryService },
      { provide: UserCourseProgressService, useValue: MockUserCourseProgressService },
      { provide: UserLearningActivityService, useValue: MockUserLearningActivityService },
      { provide: UserLearnRecordService, useValue: MockUserLearnRecordService },
    ],
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
