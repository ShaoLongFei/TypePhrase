import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { CoursePackModule } from "../course-pack/course-pack.module";
import { CourseModule } from "../course/course.module";
import { GlobalModule } from "../global/global.module";
import { ToolModule } from "../tool/tool.module";

@Module({
  imports: [GlobalModule, CoursePackModule, CourseModule, ToolModule, ScheduleModule.forRoot()],
})
export class AppModule {}
