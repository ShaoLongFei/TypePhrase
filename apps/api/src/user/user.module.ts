import { Module } from "@nestjs/common";

import { UserCourseProgressModule } from "../user-course-progress/user-course-progress.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [UserCourseProgressModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
