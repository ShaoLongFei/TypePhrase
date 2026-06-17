import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { AuthModule } from "../auth/auth.module";
import { CourseHistoryModule } from "../course-history/course-history.module";
import { CoursePackModule } from "../course-pack/course-pack.module";
import { CourseModule } from "../course/course.module";
import { GlobalModule } from "../global/global.module";
import { MasteredElementModule } from "../mastered-element/mastered-element.module";
import { MembershipModule } from "../membership/membership.module";
import { ToolModule } from "../tool/tool.module";
import { UserCourseProgressModule } from "../user-course-progress/user-course-progress.module";
import { UserLearningActivityModule } from "../user-learning-activity/user-learning-activity.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    GlobalModule,
    AuthModule,
    UserModule,
    CoursePackModule,
    CourseModule,
    UserCourseProgressModule,
    UserLearningActivityModule,
    ToolModule,
    CourseHistoryModule,
    MembershipModule,
    MasteredElementModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
