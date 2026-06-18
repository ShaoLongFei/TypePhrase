import { Controller, Get, Param, Post } from "@nestjs/common";

import { CoursePackService } from "./course-pack.service";

@Controller("course-pack")
export class CoursePackController {
  constructor(private readonly coursePackService: CoursePackService) {}

  @Get()
  async findAll() {
    return await this.coursePackService.findAll();
  }

  @Get(":coursePackId")
  async findOne(@Param("coursePackId") coursePackId: string) {
    return await this.coursePackService.findOneWithCourses(coursePackId);
  }

  @Get(":coursePackId/courses/:courseId")
  findCourse(@Param("coursePackId") coursePackId: string, @Param("courseId") courseId: string) {
    return this.coursePackService.findCourse(coursePackId, courseId);
  }

  @Get(":coursePackId/courses/:courseId/next")
  findNextCourse(@Param("coursePackId") coursePackId: string, @Param("courseId") courseId: string) {
    return this.coursePackService.findNextCourse(coursePackId, courseId);
  }

  @Post(":coursePackId/courses/:courseId/complete")
  CompleteCourse(@Param("coursePackId") coursePackId: string, @Param("courseId") courseId: string) {
    return this.coursePackService.completeCourse(coursePackId, courseId);
  }
}
