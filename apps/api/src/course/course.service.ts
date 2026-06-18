import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";

import { course, masteredElements, statement } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";

@Injectable()
export class CourseService {
  constructor(@Inject(DB) private db: DbType) {}

  async find(coursePackId: string, courseId: string, userId?: string | null) {
    const courseEntity = await this.db.query.course.findFirst({
      where: and(eq(course.id, courseId), eq(course.coursePackId, coursePackId)),
      with: {
        statements: {
          columns: {
            id: false,
          },
          orderBy: [asc(statement.order)],
        },
      },
    });

    if (!courseEntity) {
      throw new NotFoundException(
        `CoursePack with ID ${coursePackId} and CourseId with ID ${courseId} not found`,
      );
    }

    if (!userId) {
      return {
        ...courseEntity,
        statements: courseEntity.statements.map((item) => ({ ...item, isMastered: false })),
      };
    }

    const mastered = await this.db
      .select()
      .from(masteredElements)
      .where(eq(masteredElements.userId, userId));
    const masteredEnglish = new Set(
      mastered
        .map((item) => this.parseMasteredContent(item.content)?.english)
        .filter((english): english is string => Boolean(english)),
    );

    return {
      ...courseEntity,
      statements: courseEntity.statements.map((item) => ({
        ...item,
        isMastered: masteredEnglish.has(item.english),
      })),
    };
  }

  private parseMasteredContent(content: unknown): { english?: string } | null {
    if (!content) return null;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return content as { english?: string };
  }

  async findNext(coursePackId: string, courseId: string) {
    const result = await this._findNext(coursePackId, courseId);

    if (!result) {
      throw new NotFoundException(
        `Can't find the next course -> coursePackId: ${coursePackId} courseId: ${courseId}`,
      );
    }

    return result;
  }

  private async _findNext(coursePackId: string, courseId: string) {
    const { order } = await this.db.query.course.findFirst({
      where: eq(course.id, courseId),
    });

    const nextCourse = await this.db.query.course.findFirst({
      where: and(eq(course.coursePackId, coursePackId), eq(course.order, order + 1)),
    });

    return nextCourse;
  }

  async completeCourse(coursePackId: string, courseId: string) {
    const nextCourse = await this._findNext(coursePackId, courseId);

    return {
      nextCourse,
    };
  }
}
