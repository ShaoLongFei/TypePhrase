import { Module } from "@nestjs/common";

import { CourseHistoryService } from "../course-history/course-history.service";
import { GlobalModule } from "../global/global.module";
import { UserCourseProgressService } from "../user-course-progress/user-course-progress.service";
import { CourseService } from "./course.service";

@Module({
  imports: [GlobalModule],
  providers: [CourseService, UserCourseProgressService, CourseHistoryService],
  controllers: [],
  exports: [CourseService],
})
export class CourseModule {}
