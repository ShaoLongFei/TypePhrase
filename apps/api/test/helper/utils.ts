import { sql } from "drizzle-orm";
import { SignJWT } from "jose";
import { DbType } from "src/global/providers/db.provider";

import { GlobalModule } from "../../src/global/global.module";

export async function cleanDB(db: DbType) {
  await db.execute(
    sql`TRUNCATE TABLE courses, statements, "course_packs" , "user_course_progress", "course_history", "user_learning_activities", "mastered_elements", "memberships", "users" RESTART IDENTITY CASCADE;`,
  );
}

export async function signin(userId = "123456") {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(process.env.SECRET || "typephrase-dev-secret"));
}

export const testImportModules = [GlobalModule];
