import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { UserLearningActivityController } from "./user-learning-activity.controller";
import { UserLearningActivityService } from "./user-learning-activity.service";

@Module({
  imports: [AuthModule],
  controllers: [UserLearningActivityController],
  providers: [UserLearningActivityService],
  exports: [UserLearningActivityService],
})
export class UserLearningActivityModule {}
