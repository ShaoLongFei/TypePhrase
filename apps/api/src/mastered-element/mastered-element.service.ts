import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";

import { masteredElements as masteredElementsSchema } from "@earthworm/schema";
import { PracticeSourceType } from "../common/practice";
import { DB, DbType } from "../global/providers/db.provider";

export interface ElementContent {
  sourceType: PracticeSourceType;
  sourceId: string;
  english: string;
  chinese?: string;
}

@Injectable()
export class MasteredElementService {
  constructor(@Inject(DB) private db: DbType) {}

  async addMasteredElement(userId: string, content: ElementContent) {
    const normalizedContent = this.parseContent(content);
    if (
      !normalizedContent?.sourceType ||
      !normalizedContent?.sourceId ||
      !normalizedContent?.english
    ) {
      throw new BadRequestException("Element source and english content are required");
    }

    if (await this.isMastered(userId, normalizedContent)) {
      throw new BadRequestException("这个内容已经掌握了");
    }

    const [entity] = await this.db
      .insert(masteredElementsSchema)
      .values({
        userId,
        sourceType: normalizedContent.sourceType,
        sourceId: normalizedContent.sourceId,
        english: normalizedContent.english,
        chinese: normalizedContent.chinese ?? "",
        masteredAt: new Date(),
      })
      .returning();

    return entity;
  }

  async getMasteredElements(userId: string) {
    const result = await this.db
      .select()
      .from(masteredElementsSchema)
      .where(eq(masteredElementsSchema.userId, userId))
      .orderBy(desc(masteredElementsSchema.masteredAt));

    return result;
  }

  async removeMasteredElement(userId: string, elementId: string) {
    const result = await this.db
      .delete(masteredElementsSchema)
      .where(
        and(eq(masteredElementsSchema.userId, userId), eq(masteredElementsSchema.id, elementId)),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(
        `Mastered element with id ${elementId} not found for user ${userId}`,
      );
    }

    return result[0];
  }

  async isMastered(userId: string, content: ElementContent) {
    const result = await this.db
      .select()
      .from(masteredElementsSchema)
      .where(
        and(
          eq(masteredElementsSchema.userId, userId),
          eq(masteredElementsSchema.sourceType, content.sourceType),
          eq(masteredElementsSchema.sourceId, content.sourceId),
        ),
      );

    return result.length > 0;
  }

  private parseContent(content: unknown): ElementContent | null {
    if (!content) return null;
    if (typeof content !== "string") return content as ElementContent;
    const parsed = JSON.parse(content);
    if (typeof parsed === "string") {
      return JSON.parse(parsed);
    }
    return parsed;
  }
}
