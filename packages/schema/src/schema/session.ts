import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tokenHashUnique: unique().on(t.tokenHash),
  }),
);
