import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { UserProgressController } from "./user-course-progress.controller";
import { UserCourseProgressService } from "./user-course-progress.service";

@Module({
  imports: [AuthModule],
  controllers: [UserProgressController],
  providers: [UserCourseProgressService],
  exports: [UserCourseProgressService],
})
export class UserCourseProgressModule {}
