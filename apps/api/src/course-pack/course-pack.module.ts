import { Module } from "@nestjs/common";

import { CourseHistoryService } from "../course-history/course-history.service";
import { CourseModule } from "../course/course.module";
import { CoursePackController } from "./course-pack.controller";
import { CoursePackService } from "./course-pack.service";

@Module({
  imports: [CourseModule],
  providers: [CoursePackService, CourseHistoryService],
  controllers: [CoursePackController],
})
export class CoursePackModule {}
