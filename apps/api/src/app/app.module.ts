import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { AuthModule } from "../auth/auth.module";
import { CoursePackModule } from "../course-pack/course-pack.module";
import { CourseModule } from "../course/course.module";
import { GlobalModule } from "../global/global.module";
import { MasteredElementModule } from "../mastered-element/mastered-element.module";
import { ToolModule } from "../tool/tool.module";

@Module({
  imports: [
    GlobalModule,
    AuthModule,
    CoursePackModule,
    CourseModule,
    MasteredElementModule,
    ToolModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
