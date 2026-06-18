import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";

import { course, statement } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";

@Injectable()
export class CourseService {
  constructor(@Inject(DB) private db: DbType) {}

  async find(coursePackId: string, courseId: string) {
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

    return courseEntity;
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
