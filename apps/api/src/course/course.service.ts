import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";

import { course, masteredElements, sentence, statement } from "@earthworm/schema";
import { PracticeDifficulty, PracticeSourceType } from "../common/practice";
import { DB, DbType } from "../global/providers/db.provider";

export interface PracticeItem {
  id: string;
  sourceType: PracticeSourceType;
  order: number;
  english: string;
  chinese: string;
  soundmark: string;
  itemType: string;
  isMastered: boolean;
}

@Injectable()
export class CourseService {
  constructor(@Inject(DB) private db: DbType) {}

  async find(
    coursePackId: string,
    courseId: string,
    userId?: string | null,
    difficulty: PracticeDifficulty = "normal",
  ) {
    const courseEntity = await this.db.query.course.findFirst({
      where: and(eq(course.id, courseId), eq(course.coursePackId, coursePackId)),
    });

    if (!courseEntity) {
      throw new NotFoundException(
        `CoursePack with ID ${coursePackId} and CourseId with ID ${courseId} not found`,
      );
    }

    const practiceItems =
      difficulty === "hard"
        ? await this.findSentencePracticeItems(courseId)
        : await this.findStatementPracticeItems(courseId);

    if (!userId) {
      return {
        ...courseEntity,
        difficulty,
        practiceItems,
      };
    }

    const mastered = await this.db
      .select()
      .from(masteredElements)
      .where(eq(masteredElements.userId, userId));
    const masteredKeys = new Set(mastered.map((item) => this.getMasteredKey(item)));

    return {
      ...courseEntity,
      difficulty,
      practiceItems: practiceItems.map((item) => ({
        ...item,
        isMastered: masteredKeys.has(this.getPracticeItemKey(item)),
      })),
    };
  }

  private async findStatementPracticeItems(courseId: string): Promise<PracticeItem[]> {
    const items = await this.db.query.statement.findMany({
      where: eq(statement.courseId, courseId),
      orderBy: [asc(statement.displayOrder)],
    });

    return items.map((item) => ({
      id: item.id,
      sourceType: "statement",
      order: item.displayOrder,
      english: item.english,
      chinese: item.chinese,
      soundmark: item.soundmark,
      itemType: item.statementType,
      isMastered: false,
    }));
  }

  private async findSentencePracticeItems(courseId: string): Promise<PracticeItem[]> {
    const items = await this.db.query.sentence.findMany({
      where: eq(sentence.courseId, courseId),
      orderBy: [asc(sentence.sortOrder)],
    });

    return items.map((item) => ({
      id: item.id,
      sourceType: "sentence",
      order: item.sortOrder,
      english: item.english || item.content,
      chinese: item.chinese,
      soundmark: "",
      itemType: "sentence",
      isMastered: false,
    }));
  }

  private getPracticeItemKey(item: Pick<PracticeItem, "sourceType" | "id">) {
    return `${item.sourceType}:${item.id}`;
  }

  private getMasteredKey(item: { sourceType: string; sourceId: string }) {
    return `${item.sourceType}:${item.sourceId}`;
  }

  async findNext(coursePackId: string, courseId: string) {
    const result = await this._findNext(coursePackId, courseId);

    if (!result) {
      throw new NotFoundException(
        `Can't find the next course -> coursePackId: ${coursePackId} courseId: ${courseId}`,
      );
    }

    return result;
  }

  private async _findNext(coursePackId: string, courseId: string) {
    const { displayOrder } = await this.db.query.course.findFirst({
      where: eq(course.id, courseId),
    });

    const nextCourse = await this.db.query.course.findFirst({
      where: and(eq(course.coursePackId, coursePackId), eq(course.displayOrder, displayOrder + 1)),
    });

    return nextCourse;
  }

  async completeCourse(coursePackId: string, courseId: string) {
    const nextCourse = await this._findNext(coursePackId, courseId);

    return {
      nextCourse,
    };
  }
}
