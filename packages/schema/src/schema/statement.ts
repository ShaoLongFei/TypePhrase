import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { course } from "./course";
import { sentence } from "./sentence";

export const statement = pgTable("statements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  displayOrder: integer("display_order").notNull(),
  sentenceId: text("sentence_id"),
  chinese: text("chinese").notNull().default(""),
  english: text("english").notNull(),
  soundmark: text("soundmark").notNull().default(""),
  statementType: text("statement_type").notNull().default(""),
  rawJson: jsonb("raw_json").$type<Record<string, unknown>>().notNull().default({}),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const statementRelations = relations(statement, ({ one }) => ({
  course: one(course, {
    fields: [statement.courseId],
    references: [course.id],
  }),
  sentence: one(sentence, {
    fields: [statement.sentenceId],
    references: [sentence.id],
  }),
}));
