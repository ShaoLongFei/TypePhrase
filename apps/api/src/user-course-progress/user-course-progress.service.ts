import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";

import { coursePack, userCourseProgress } from "@earthworm/schema";
import { DEFAULT_PRACTICE_DIFFICULTY, PracticeDifficulty } from "../common/practice";
import { DB, DbType } from "../global/providers/db.provider";

@Injectable()
export class UserCourseProgressService {
  constructor(@Inject(DB) private db: DbType) {}

  async findPracticeIndex(
    userId: string,
    coursePackId: string,
    courseId: string,
    difficulty: PracticeDifficulty = DEFAULT_PRACTICE_DIFFICULTY,
  ) {
    const result = await this.db.query.userCourseProgress.findFirst({
      where: and(
        eq(userCourseProgress.userId, userId),
        eq(userCourseProgress.coursePackId, coursePackId),
        eq(userCourseProgress.courseId, courseId),
        eq(userCourseProgress.difficulty, difficulty),
      ),
    });

    return result ? result.practiceIndex : 0;
  }

  async getUserRecentCoursePacks(userId: string, limit: number) {
    const userCourseProgressResult = await this.db
      .select({
        id: userCourseProgress.id,
        coursePackId: userCourseProgress.coursePackId,
        courseId: userCourseProgress.courseId,
        title: coursePack.title,
        description: coursePack.description,
        cover: coursePack.cover,
        difficulty: userCourseProgress.difficulty,
      })
      .from(userCourseProgress)
      .where(eq(userCourseProgress.userId, userId))
      .orderBy(desc(userCourseProgress.updatedAt))
      .limit(limit)
      .leftJoin(coursePack, eq(userCourseProgress.coursePackId, coursePack.id));

    return userCourseProgressResult;
  }

  async upsert(
    userId: string,
    coursePackId: string,
    courseId: string,
    difficulty: PracticeDifficulty,
    practiceIndex: number,
  ) {
    await this.db
      .insert(userCourseProgress)
      .values({
        userId,
        coursePackId,
        courseId,
        difficulty,
        practiceIndex,
      })
      .onConflictDoUpdate({
        target: [
          userCourseProgress.userId,
          userCourseProgress.coursePackId,
          userCourseProgress.difficulty,
        ],
        set: { courseId, practiceIndex, updatedAt: new Date() },
      });
  }
}
