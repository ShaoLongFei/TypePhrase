import { createId } from "@paralleldrive/cuid2";
import { pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    username: varchar("username", { length: 20 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    avatar: text("avatar").default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    phoneUnique: unique().on(t.phone),
  }),
);
