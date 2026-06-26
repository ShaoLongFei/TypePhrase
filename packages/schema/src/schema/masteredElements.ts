import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const masteredElements = pgTable(
  "mastered_elements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    english: text("english").notNull(),
    chinese: text("chinese").notNull().default(""),
    masteredAt: timestamp("mastered_at").defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.userId, t.sourceType, t.sourceId),
  }),
);
