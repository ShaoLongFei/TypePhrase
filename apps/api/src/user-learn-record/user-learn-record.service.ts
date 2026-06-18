import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { userLearnRecord } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";

@Injectable()
export class UserLearnRecordService {
  constructor(@Inject(DB) private db: DbType) {}

  async increment(userId: string, day: Date, count: number) {
    if (count < 0) {
      throw new BadRequestException("Learning count cannot be negative");
    }

    if (count === 0) return true;

    const dayText = day.toISOString().split("T")[0];
    await this.db
      .insert(userLearnRecord)
      .values({
        userId,
        day: dayText,
        count,
      })
      .onConflictDoUpdate({
        target: [userLearnRecord.userId, userLearnRecord.day],
        set: {
          count: sql`${userLearnRecord.count} + ${count}`,
          updatedAt: new Date(),
        },
      });

    return true;
  }
}
