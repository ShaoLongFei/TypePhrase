import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { course } from "./course";

export const coursePack = pgTable("course_packs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  cover: text("cover"),
  rawJson: jsonb("raw_json").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const coursePackRelations = relations(coursePack, ({ many }) => ({
  courses: many(course),
}));
