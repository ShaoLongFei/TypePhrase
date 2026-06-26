import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createId } from "@paralleldrive/cuid2";

import type { DbType } from "../../global/providers/db.provider";
import { insertCourse, insertCoursePack, insertStatement } from "../../../test/fixture/db";
import { cleanDB, testImportModules } from "../../../test/helper/utils";
import { endDB } from "../../common/db";
import { DB } from "../../global/providers/db.provider";
import { CourseService } from "../course.service";

describe("course service", () => {
  let db: DbType;
  let courseService: CourseService;

  beforeAll(async () => {
    const testHelper = await setupTesting();
    await setupDatabaseData(testHelper.db);

    db = testHelper.db;
    courseService = testHelper.courseService;
  });
  beforeEach(async () => {
    await cleanDB(db);
  });

  afterAll(async () => {
    await cleanDB(db);
    await endDB();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe("find", () => {
    it("should return a course with the given coursePackId and courseId", async () => {
      const { coursePackId, courseEntityFirst } = await setupDBData(db);

      const result = await courseService.find(coursePackId, courseEntityFirst.id, null, "normal");

      expect(result).toHaveProperty("coursePackId");
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("displayOrder");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("practiceItems");
    });

    it("should throw NotFoundException if the course does not exist", async () => {
      await expect(courseService.find(createId(), createId())).rejects.toThrow(NotFoundException);
    });
  });

  describe("findNext", () => {
    it("should return the next course", async () => {
      const { coursePackId, courseEntityFirst, courseEntitySecond } = await setupDBData(db);

      const result = await courseService.findNext(coursePackId, courseEntityFirst.id);

      expect(result).toEqual(courseEntitySecond);
    });

    it("should throw NotFoundException if there is no next course", async () => {
      const { coursePackId, courseEntitySecond } = await setupDBData(db);

      await expect(courseService.findNext(coursePackId, courseEntitySecond.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("completeCourse", () => {
    it("should complete a course anonymously and return the next course", async () => {
      const { courseEntityFirst, coursePackId } = await setupDBData(db);

      const result = await courseService.completeCourse(coursePackId, courseEntityFirst.id);

      expect(result).toHaveProperty("nextCourse");
    });

    it("should not have nextCourse when not exist next course", async () => {
      const { courseEntitySecond, coursePackId } = await setupDBData(db);

      const result = await courseService.completeCourse(coursePackId, courseEntitySecond.id);

      expect(result.nextCourse).toBeUndefined();
    });
  });
});

async function setupDatabaseData(db: DbType) {
  await cleanDB(db);
}

async function setupTesting() {
  const moduleRef = await Test.createTestingModule({
    imports: testImportModules,
    providers: [CourseService],
  }).compile();

  return {
    courseService: moduleRef.get<CourseService>(CourseService),
    db: moduleRef.get<DbType>(DB),
    moduleRef,
  };
}

async function setupDBData(db: DbType) {
  const coursePackEntity = await insertCoursePack(db);
  const courseEntityFirst = await insertCourse(db, coursePackEntity.id, {
    title: "第一课",
    displayOrder: 1,
  });
  const courseEntitySecond = await insertCourse(db, coursePackEntity.id, {
    title: "第二课",
    displayOrder: 2,
  });
  const statementEntityFirst = await insertStatement(db, courseEntityFirst.id, 1);
  const statementEntitySecond = await insertStatement(db, courseEntityFirst.id, 2);

  return {
    coursePackId: coursePackEntity.id,
    courseEntityFirst,
    courseEntitySecond,
    statementEntityFirst,
    statementEntitySecond,
  };
}
