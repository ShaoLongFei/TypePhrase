import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { course } from "./course";

export const sentence = pgTable("sentences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id),
  content: text("content").notNull().default(""),
  english: text("english").notNull().default(""),
  chinese: text("chinese").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
  rawJson: jsonb("raw_json").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const sentenceRelations = relations(sentence, ({ one }) => ({
  course: one(course, {
    fields: [sentence.courseId],
    references: [course.id],
  }),
}));
