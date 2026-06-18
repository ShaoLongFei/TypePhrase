import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { CoursePackService } from "./course-pack.service";
import { CompleteCourseDto } from "./dto/complete-course.dto";

@Controller("course-pack")
@UseGuards(AuthGuard)
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
  async findCourse(
    @Param("coursePackId") coursePackId: string,
    @Param("courseId") courseId: string,
    @User() user: UserEntity,
  ) {
    return this.coursePackService.findCourse(coursePackId, courseId, user.userId);
  }

  @Get(":coursePackId/courses/:courseId/next")
  findNextCourse(@Param("coursePackId") coursePackId: string, @Param("courseId") courseId: string) {
    return this.coursePackService.findNextCourse(coursePackId, courseId);
  }

  @Post(":coursePackId/courses/:courseId/complete")
  CompleteCourse(
    @Param("coursePackId") coursePackId: string,
    @Param("courseId") courseId: string,
    @User() user: UserEntity,
    @Body() dto: CompleteCourseDto = {},
  ) {
    return this.coursePackService.completeCourse(coursePackId, courseId, user.userId, {
      duration: dto.duration,
      count: dto.count,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : new Date(),
    });
  }
}
