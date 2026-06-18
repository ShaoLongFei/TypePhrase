import { Module } from "@nestjs/common";

import { GlobalModule } from "../global/global.module";
import { CourseService } from "./course.service";

@Module({
  imports: [GlobalModule],
  providers: [CourseService],
  controllers: [],
  exports: [CourseService],
})
export class CourseModule {}
