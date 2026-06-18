import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";

import { course, coursePack } from "@earthworm/schema";
import { CourseService } from "../course/course.service";
import { DB, DbType } from "../global/providers/db.provider";

@Injectable()
export class CoursePackService {
  constructor(
    @Inject(DB) private db: DbType,
    private readonly courseService: CourseService,
  ) {}

  async findAll() {
    return await this.findAllPublicCoursePacks();
  }

  async findAllPublicCoursePacks() {
    return await this.db.query.coursePack.findMany({
      orderBy: asc(coursePack.order),
      where: eq(coursePack.shareLevel, "public"),
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
          orderBy: asc(course.order),
        },
      },
    });

    if (!coursePackWithCourses) {
      throw new NotFoundException(`CoursePack with ID ${coursePackId} not found`);
    }

    if (coursePackWithCourses.shareLevel !== "public") {
      throw new NotFoundException(`CoursePack with ID ${coursePackId} not found`);
    }

    return coursePackWithCourses;
  }

  async findCourse(coursePackId: string, courseId: string) {
    return await this.courseService.find(coursePackId, courseId);
  }

  async findNextCourse(coursePackId: string, courseId: string) {
    return await this.courseService.findNext(coursePackId, courseId);
  }

  async completeCourse(coursePackId: string, courseId: string) {
    return await this.courseService.completeCourse(coursePackId, courseId);
  }
}
