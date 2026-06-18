import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CourseHistoryController } from "./course-history.controller";
import { CourseHistoryService } from "./course-history.service";

@Module({
  imports: [AuthModule],
  controllers: [CourseHistoryController],
  providers: [CourseHistoryService],
  exports: [CourseHistoryService],
})
export class CourseHistoryModule {}
