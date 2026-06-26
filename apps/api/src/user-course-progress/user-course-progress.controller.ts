import { Body, Controller, Get, Put, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { UpsertUserProgressDto } from "./model/user-progress.dto";
import { UserCourseProgressService } from "./user-course-progress.service";

@ApiTags("UserProgress")
@Controller("user-course-progress")
export class UserProgressController {
  constructor(private readonly userCourseProgressService: UserCourseProgressService) {}

  @UseGuards(AuthGuard)
  @Get("/recent-course-packs")
  async getUserRecentCoursePacks(@User() user: UserEntity, @Query("limit") limit: number) {
    const recentCoursePacks = await this.userCourseProgressService.getUserRecentCoursePacks(
      user.userId,
      limit || 3,
    );
    return recentCoursePacks;
  }

  @UseGuards(AuthGuard)
  @Put()
  async upsert(@User() user: UserEntity, @Body() dto: UpsertUserProgressDto) {
    const result = await this.userCourseProgressService.upsert(
      user.userId,
      dto.coursePackId,
      dto.courseId,
      dto.difficulty,
      dto.practiceIndex,
    );

    return result;
  }
}
