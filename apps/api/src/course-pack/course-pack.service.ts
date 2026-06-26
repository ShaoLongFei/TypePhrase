import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";

import { course, coursePack } from "@earthworm/schema";
import { DEFAULT_PRACTICE_DIFFICULTY, PracticeDifficulty } from "../common/practice";
import { CourseHistoryService } from "../course-history/course-history.service";
import { CourseService } from "../course/course.service";
import { DB, DbType } from "../global/providers/db.provider";
import { UserCourseProgressService } from "../user-course-progress/user-course-progress.service";
import { UserLearnRecordService } from "../user-learn-record/user-learn-record.service";
import { UserLearningActivityService } from "../user-learning-activity/user-learning-activity.service";

export interface CompleteCourseStats {
  duration?: number;
  count?: number;
  completedAt?: Date;
  difficulty?: PracticeDifficulty;
}

@Injectable()
export class CoursePackService {
  constructor(
    @Inject(DB) private db: DbType,
    private readonly courseService: CourseService,
    private readonly courseHistoryService: CourseHistoryService,
    private readonly userCourseProgressService: UserCourseProgressService,
    private readonly userLearningActivityService: UserLearningActivityService,
    private readonly userLearnRecordService: UserLearnRecordService,
  ) {}

  async findAll() {
    return await this.findAllPublicCoursePacks();
  }

  async findAllPublicCoursePacks() {
    return await this.db.query.coursePack.findMany({
      orderBy: asc(coursePack.title),
    });
  }

  async findOne(coursePackId: string) {
    const result = await this.db.query.coursePack.findFirst({
      where: eq(coursePack.id, coursePackId),
    });

    if (!result) {
      throw new NotFoundException(`CoursePack with ID ${coursePackId} not found`);
    }

    return result;
  }

  async findOneWithCourses(coursePackId: string) {
    return await this.findCoursePackWithCourses(coursePackId);
  }

  private async findCoursePackWithCourses(coursePackId: string) {
    const coursePackWithCourses = await this.db.query.coursePack.findFirst({
      where: and(eq(coursePack.id, coursePackId)),
      with: {
        courses: {
          orderBy: asc(course.displayOrder),
        },
      },
    });

    if (!coursePackWithCourses) {
      throw new NotFoundException(`CoursePack with ID ${coursePackId} not found`);
    }

    return coursePackWithCourses;
  }

  async findCourse(
    coursePackId: string,
    courseId: string,
    userId?: string | null,
    difficulty: PracticeDifficulty = DEFAULT_PRACTICE_DIFFICULTY,
  ) {
    const courseEntity = await this.courseService.find(coursePackId, courseId, userId, difficulty);
    if (!userId) {
      return {
        ...courseEntity,
        practiceIndex: 0,
        completionCount: 0,
      };
    }

    const [practiceIndex, completionCount] = await Promise.all([
      this.userCourseProgressService.findPracticeIndex(userId, coursePackId, courseId, difficulty),
      this.courseHistoryService.findCompletionCount(userId, coursePackId, courseId, difficulty),
    ]);

    return {
      ...courseEntity,
      practiceIndex,
      completionCount,
    };
  }

  async findNextCourse(coursePackId: string, courseId: string) {
    return await this.courseService.findNext(coursePackId, courseId);
  }

  async completeCourse(
    coursePackId: string,
    courseId: string,
    userId?: string | null,
    stats: CompleteCourseStats = {},
  ) {
    const difficulty = stats.difficulty ?? DEFAULT_PRACTICE_DIFFICULTY;
    const result = await this.courseService.completeCourse(coursePackId, courseId);

    if (userId) {
      const completedAt = stats.completedAt ?? new Date();
      await this.courseHistoryService.upsert(userId, coursePackId, courseId, difficulty);

      if (stats.duration && stats.duration > 0) {
        await this.userLearningActivityService.upsertActivity(
          userId,
          completedAt,
          "course_learning_time",
          stats.duration,
          courseId,
          { coursePackId, difficulty },
        );
      }

      if (stats.count && stats.count > 0) {
        await this.userLearnRecordService.increment(userId, completedAt, stats.count);
      }
    }

    return result;
  }
}
