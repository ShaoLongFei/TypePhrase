import type { Request } from "express";

import { Controller, Get, Param, Post, Req } from "@nestjs/common";

import { AuthService } from "../auth/auth.service";
import { CoursePackService } from "./course-pack.service";

@Controller("course-pack")
export class CoursePackController {
  constructor(
    private readonly coursePackService: CoursePackService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async findAll() {
    return await this.coursePackService.findAll();
  }

  @Get(":coursePackId")
  async findOne(@Param("coursePackId") coursePackId: string) {
    return await this.coursePackService.findOneWithCourses(coursePackId);
  }

  @Get(":coursePackId/courses/:courseId")
  async findCourse(
    @Param("coursePackId") coursePackId: string,
    @Param("courseId") courseId: string,
    @Req() request: Request,
  ) {
    const userId = await this.authService.findUserIdByRequest(request);
    return this.coursePackService.findCourse(coursePackId, courseId, userId);
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
