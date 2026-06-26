import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { coursePack } from "./coursePack";
import { sentence } from "./sentence";
import { statement } from "./statement";

export const course = pgTable("courses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  displayOrder: integer("display_order").notNull(),
  courseType: text("course_type").notNull().default("normal"),
  rawJson: jsonb("raw_json").$type<Record<string, unknown>>().notNull().default({}),
  coursePackId: text("course_pack_id")
    .notNull()
    .references(() => coursePack.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const courseRelations = relations(course, ({ one, many }) => ({
  statements: many(statement),
  sentences: many(sentence),
  coursePack: one(coursePack, {
    fields: [course.coursePackId],
    references: [coursePack.id],
  }),
}));
