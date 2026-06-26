import { Test } from "@nestjs/testing";
import { createId } from "@paralleldrive/cuid2";

import { insertCoursePack } from "../../../test/fixture/db";
import { cleanDB, testImportModules } from "../../../test/helper/utils";
import { endDB } from "../../common/db";
import { DB, DbType } from "../../global/providers/db.provider";
import { UserCourseProgressService } from "../user-course-progress.service";

describe("user-progress service", () => {
  let userCourseProgressService: UserCourseProgressService;
  let db: DbType;

  beforeAll(async () => {
    const testHelper = await setupTesting();
    await setupDatabaseData(testHelper.db);

    db = testHelper.db;
    userCourseProgressService = testHelper.userCourseProgressService;
  });

  afterAll(async () => {
    await cleanDB(db);
    await endDB();
  });

  beforeEach(async () => {
    await cleanDB(db);
  });

  it("should update an existing progress entry for the same difficulty", async () => {
    const userId = "cxr";
    const coursePackId = createId();
    const courseId = createId();
    const practiceIndex = 1;
    const newPracticeIndex = 2;
    await userCourseProgressService.upsert(userId, coursePackId, courseId, "normal", practiceIndex);

    await userCourseProgressService.upsert(
      userId,
      coursePackId,
      courseId,
      "normal",
      newPracticeIndex,
    );

    const result = await userCourseProgressService.findPracticeIndex(
      userId,
      coursePackId,
      courseId,
      "normal",
    );

    expect(result).toBe(newPracticeIndex);
  });

  it("should keep normal and hard difficulty progress separate", async () => {
    const userId = "cxr";
    const coursePackId = createId();
    const courseId = createId();
    await userCourseProgressService.upsert(userId, coursePackId, courseId, "normal", 1);
    await userCourseProgressService.upsert(userId, coursePackId, courseId, "hard", 4);

    const normalResult = await userCourseProgressService.findPracticeIndex(
      userId,
      coursePackId,
      courseId,
      "normal",
    );
    const hardResult = await userCourseProgressService.findPracticeIndex(
      userId,
      coursePackId,
      courseId,
      "hard",
    );

    expect(normalResult).toBe(1);
    expect(hardResult).toBe(4);
  });

  it("should return 0 when there is no progress for the specific course pack and course", async () => {
    // not add any user course progress
    const practiceIndex = await userCourseProgressService.findPracticeIndex(
      "cxr",
      createId(),
      createId(),
      "normal",
    );

    expect(practiceIndex).toBe(0);
  });

  describe("getUserRecentCoursePacks", () => {
    const userId = "cxr";
    let coursePackEntityFirst;
    let coursePackEntitySecond;

    beforeEach(async () => {
      coursePackEntityFirst = await insertCoursePack(db, {
        title: "零基础",
        description: "这是零基础学英语",
        cover: "",
      });

      coursePackEntitySecond = await insertCoursePack(db, {
        title: "300个基础句子",
        description: "快乐学英语",
        cover: "",
      });
    });

    it("should return the actual number of course packs when there are not enough course packs", async () => {
      const limit = 5;

      const courseId1 = createId();
      const courseId2 = createId();
      await userCourseProgressService.upsert(
        userId,
        coursePackEntityFirst.id,
        courseId1,
        "normal",
        1,
      );
      await userCourseProgressService.upsert(
        userId,
        coursePackEntityFirst.id,
        courseId2,
        "normal",
        1,
      );

      const recentCoursePacks = await userCourseProgressService.getUserRecentCoursePacks(
        userId,
        limit,
      );

      expect(recentCoursePacks.length).toBe(1);

      expect(recentCoursePacks[0]).toEqual(
        expect.objectContaining({
          coursePackId: coursePackEntityFirst.id,
          courseId: courseId2,
          title: coursePackEntityFirst.title,
          description: coursePackEntityFirst.description,
          cover: expect.anything(),
        }),
      );
    });

    it("should return the recent course packs for a given user up to the specified limit", async () => {
      const limit = 1;

      await userCourseProgressService.upsert(
        userId,
        coursePackEntityFirst.id,
        createId(),
        "normal",
        1,
      );
      await userCourseProgressService.upsert(
        userId,
        coursePackEntitySecond.id,
        createId(),
        "normal",
        1,
      );

      const recentCoursePacks = await userCourseProgressService.getUserRecentCoursePacks(
        userId,
        limit,
      );

      expect(recentCoursePacks.length).toBe(1);
    });
  });
});

async function setupDatabaseData(db: DbType) {
  await cleanDB(db);
}
async function setupTesting() {
  const moduleRef = await Test.createTestingModule({
    imports: testImportModules,
    providers: [UserCourseProgressService],
  }).compile();

  return {
    db: moduleRef.get<DbType>(DB),
    userCourseProgressService: moduleRef.get<UserCourseProgressService>(UserCourseProgressService),
  };
}
