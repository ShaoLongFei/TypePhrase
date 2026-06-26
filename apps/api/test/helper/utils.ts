import { sql } from "drizzle-orm";
import { DbType } from "src/global/providers/db.provider";

import { GlobalModule } from "../../src/global/global.module";

export async function cleanDB(db: DbType) {
  await db.execute(
    sql`TRUNCATE TABLE courses, statements, sentences, "course_packs", "user_course_progress", "course_history", "user_learning_activities", "user_learn_record", "mastered_elements", "sessions", "users" RESTART IDENTITY CASCADE;`,
  );
}

export const testImportModules = [GlobalModule];
