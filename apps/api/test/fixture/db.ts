import { DbType } from "src/global/providers/db.provider";

import { course, coursePack, sentence, statement, userCourseProgress } from "@earthworm/schema";
import { getTestUserId } from "../../test/fixture/user";

type CoursePackInsert = typeof coursePack.$inferInsert;

export async function insertCoursePack(db: DbType, values?: Partial<CoursePackInsert>) {
  const defaultCoursePack = {
    title: "课程包",
    description: "这是一个课程包",
    cover: "",
    rawJson: {},
  } satisfies CoursePackInsert;

  const [entity] = await db
    .insert(coursePack)
    .values({
      ...defaultCoursePack,
      ...values,
    })
    .returning();

  return entity;
}

type CourseInsert = typeof course.$inferInsert;
export async function insertCourse(
  db: DbType,
  coursePackId: string,
  values?: Partial<CourseInsert>,
) {
  const defaultCourse = {
    displayOrder: 1,
    title: "第一课",
    coursePackId,
    courseType: "normal",
    rawJson: {},
  } satisfies CourseInsert;

  const [entity] = await db
    .insert(course)
    .values({
      ...defaultCourse,
      ...values,
    })
    .returning();

  return entity;
}

type StatementInsert = typeof statement.$inferInsert;
export async function insertStatement(
  db: DbType,
  courseId: string,
  order: number,
  values?: Partial<StatementInsert>,
) {
  const defaultStatement = {
    displayOrder: order,
    courseId,
    chinese: "你好",
    english: "hello",
    soundmark: "nihao",
    statementType: "word",
    rawJson: {},
  } satisfies StatementInsert;

  const [entity] = await db
    .insert(statement)
    .values({
      ...defaultStatement,
      ...values,
    })
    .returning();

  return entity;
}

type SentenceInsert = typeof sentence.$inferInsert;
export async function insertSentence(
  db: DbType,
  courseId: string,
  sortOrder: number,
  values?: Partial<SentenceInsert>,
) {
  const defaultSentence = {
    courseId,
    content: "hello",
    english: "hello",
    chinese: "你好",
    sortOrder,
    rawJson: {},
  } satisfies SentenceInsert;

  const [entity] = await db
    .insert(sentence)
    .values({
      ...defaultSentence,
      ...values,
    })
    .returning();

  return entity;
}

export async function insertUserCourseProgress(
  db,
  coursePackId: string,
  courseId: string,
  practiceIndex: number,
  difficulty = "normal",
) {
  const [entity] = await db
    .insert(userCourseProgress)
    .values({
      userId: getTestUserId(),
      coursePackId,
      courseId,
      difficulty,
      practiceIndex,
    })
    .returning();

  return entity;
}
