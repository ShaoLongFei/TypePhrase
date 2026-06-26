import { HttpException, Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";

import { course, coursePack, users } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";
import { UserCourseProgressService } from "../user-course-progress/user-course-progress.service";
import { UserEntity } from "../user/user.decorators";
import { UpdateUserDto } from "./model/user.dto";

@Injectable()
export class UserService {
  constructor(
    @Inject(DB) private db: DbType,
    private readonly userCourseProgressService: UserCourseProgressService,
  ) {}

  async findUser(uId: string) {
    try {
      const userInfo = await this.findLocalUser(uId);
      if (!userInfo) return undefined;
      return userInfo;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return undefined;
    }
  }

  async findCurrentUser(uId: string) {
    try {
      const userInfo = await this.findLocalUser(uId);
      if (!userInfo) return undefined;
      return userInfo;
    } catch (error) {
      console.error("Error fetching current user info:", error);
      return undefined;
    }
  }

  async updateUser(user: UserEntity, dto: UpdateUserDto) {
    try {
      const [data] = await this.db
        .update(users)
        .set(dto)
        .where(eq(users.id, user.userId))
        .returning();
      return this.toPublicUser(data);
    } catch (e) {
      throw new HttpException(e.message, e.status || 500);
    }
  }

  async setupNewUser(user: UserEntity, dto: { username: string; avatar: string }) {
    if (!dto.avatar) {
      dto.avatar = this.getAvatarUrl();
    }

    await this.updateUser(user, { username: dto.username, avatar: dto.avatar });

    const { id, courses } = await this.db.query.coursePack.findFirst({
      orderBy: [asc(coursePack.title)],
      with: {
        courses: {
          orderBy: [asc(course.displayOrder)],
          limit: 1,
        },
      },
    });

    await this.userCourseProgressService.upsert(user.userId, id, courses.at(0).id, "normal", 0);
    return {
      avatar: dto.avatar,
      username: dto.username,
    };
  }

  private getAvatarUrl() {
    const order = this.getRandomNumber();

    return `https://earthworm-prod-1312884695.cos.ap-beijing.myqcloud.com/avatars/avatar${order}.png`;
  }

  private getRandomNumber() {
    return Math.floor(Math.random() * 9) + 1;
  }

  private async findLocalUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return user ? this.toPublicUser(user) : undefined;
  }

  private toPublicUser(user: typeof users.$inferSelect) {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
