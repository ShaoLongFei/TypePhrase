import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CourseHistoryModule } from "../course-history/course-history.module";
import { CourseModule } from "../course/course.module";
import { UserCourseProgressModule } from "../user-course-progress/user-course-progress.module";
import { UserLearnRecordModule } from "../user-learn-record/user-learn-record.module";
import { UserLearningActivityModule } from "../user-learning-activity/user-learning-activity.module";
import { CoursePackController } from "./course-pack.controller";
import { CoursePackService } from "./course-pack.service";

@Module({
  imports: [
    AuthModule,
    CourseModule,
    CourseHistoryModule,
    UserCourseProgressModule,
    UserLearningActivityModule,
    UserLearnRecordModule,
  ],
  providers: [CoursePackService],
  controllers: [CoursePackController],
})
export class CoursePackModule {}
