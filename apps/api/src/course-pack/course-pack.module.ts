import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CourseModule } from "../course/course.module";
import { CoursePackController } from "./course-pack.controller";
import { CoursePackService } from "./course-pack.service";

@Module({
  imports: [AuthModule, CourseModule],
  providers: [CoursePackService],
  controllers: [CoursePackController],
})
export class CoursePackModule {}
