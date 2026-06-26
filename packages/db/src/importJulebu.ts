import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import dotenv from "dotenv";
import postgres from "postgres";

type PgSql = ReturnType<typeof postgres>;

type SqliteScalar = string | number | null;
type SqliteRecord = Record<string, SqliteScalar>;

type CoursePackRow = {
  id: string;
  title: string | null;
  description: string | null;
  cover: string | null;
  raw_json: string;
};

type CourseRow = {
  id: string;
  course_pack_id: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
  course_type: string | null;
  raw_json: string;
};

type SentenceRow = {
  id: string;
  course_id: string;
  content: string | null;
  english: string | null;
  chinese: string | null;
  sort_order: number | null;
  raw_json: string;
};

type StatementRow = {
  id: string;
  course_id: string;
  sentence_id: string | null;
  chinese: string | null;
  english: string | null;
  soundmark: string | null;
  statement_type: string | null;
  display_order: number | null;
  raw_json: string;
};

type ImportCounts = {
  coursePacks: number;
  courses: number;
  sentences: number;
  statements: number;
};

type ImportOptions = {
  sqlitePath: string;
  dryRun: boolean;
};

const REQUIRED_TABLES = ["course_packs", "courses", "sentences", "statements"] as const;
const BATCH_SIZE = 1000;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sqlite = openSqlite(options.sqlitePath);

  try {
    assertRequiredTables(sqlite);
    const counts = getCounts(sqlite);

    if (options.dryRun) {
      printCounts("Dry run passed", counts);
      return;
    }

    const databaseUrl = getDatabaseUrl();
    const sql = postgres(databaseUrl, { max: 1 });

    try {
      await sql.begin(async (tx) => {
        await truncateOldData(tx);
        await importCoursePacks(sqlite, tx);
        await importCourses(sqlite, tx);
        await importSentences(sqlite, tx);
        await importStatements(sqlite, tx);
      });
    } finally {
      await sql.end();
    }

    printCounts("Import completed", counts);
  } finally {
    sqlite.close();
  }
}

function parseArgs(args: string[]): ImportOptions {
  let sqlitePath = "";
  let dryRun = false;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--") {
      continue;
    }
    if (arg === "--sqlite") {
      sqlitePath = args[index + 1] ?? "";
      index++;
      continue;
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!sqlitePath) {
    throw new Error("Missing required --sqlite path");
  }

  return {
    sqlitePath: path.resolve(process.env.INIT_CWD ?? process.cwd(), sqlitePath),
    dryRun,
  };
}

function openSqlite(sqlitePath: string) {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite file not found: ${sqlitePath}`);
  }

  return new Database(sqlitePath, { readonly: true, fileMustExist: true });
}

function assertRequiredTables(sqlite: Database.Database) {
  const rows = sqlite
    .prepare("select name from sqlite_master where type = 'table'")
    .all() as Array<{ name: string }>;
  const tableNames = new Set(rows.map((row) => row.name));
  const missingTables = REQUIRED_TABLES.filter((tableName) => !tableNames.has(tableName));

  if (missingTables.length > 0) {
    throw new Error(`SQLite is missing required tables: ${missingTables.join(", ")}`);
  }
}

function getCounts(sqlite: Database.Database): ImportCounts {
  return {
    coursePacks: getCount(sqlite, "course_packs"),
    courses: getCount(sqlite, "courses"),
    sentences: getCount(sqlite, "sentences"),
    statements: getCount(sqlite, "statements"),
  };
}

function getCount(sqlite: Database.Database, tableName: (typeof REQUIRED_TABLES)[number]) {
  const row = sqlite.prepare(`select count(*) as count from ${tableName}`).get() as {
    count: number;
  };
  return row.count;
}

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const envName = process.env.NODE_ENV === "prod" ? ".env.prod" : ".env";
    dotenv.config({ path: path.resolve(__dirname, `../../../apps/api/${envName}`) });
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for import");
  }

  return process.env.DATABASE_URL;
}

async function truncateOldData(sql: PgSql) {
  await sql`
    truncate table
      course_history,
      user_course_progress,
      user_learning_activities,
      user_learn_record,
      mastered_elements,
      statements,
      sentences,
      courses,
      course_packs
    restart identity cascade
  `;
}

async function importCoursePacks(sqlite: Database.Database, sql: PgSql) {
  await importInBatches<CoursePackRow>(
    sqlite,
    "course_packs",
    "select id, title, description, cover, raw_json from course_packs order by id",
    (rows) => insertCoursePacks(sql, rows.map(mapCoursePackRow)),
  );
}

async function importCourses(sqlite: Database.Database, sql: PgSql) {
  await importInBatches<CourseRow>(
    sqlite,
    "courses",
    [
      "select id, course_pack_id, title, description, display_order, course_type, raw_json",
      "from courses order by course_pack_id, display_order, id",
    ].join(" "),
    (rows) => insertCourses(sql, rows.map(mapCourseRow)),
  );
}

async function importSentences(sqlite: Database.Database, sql: PgSql) {
  await importInBatches<SentenceRow>(
    sqlite,
    "sentences",
    [
      "select id, course_id, content, english, chinese, sort_order, raw_json",
      "from sentences order by course_id, sort_order, id",
    ].join(" "),
    (rows) => insertSentences(sql, rows.map(mapSentenceRow)),
  );
}

async function importStatements(sqlite: Database.Database, sql: PgSql) {
  await importInBatches<StatementRow>(
    sqlite,
    "statements",
    [
      "select id, course_id, sentence_id, chinese, english, soundmark, statement_type, display_order, raw_json",
      "from statements order by course_id, display_order, id",
    ].join(" "),
    (rows) => insertStatements(sql, rows.map(mapStatementRow)),
  );
}

async function importInBatches<Row extends SqliteRecord>(
  sqlite: Database.Database,
  tableName: string,
  query: string,
  insertBatch: (rows: Row[]) => Promise<void>,
) {
  const iterator = sqlite.prepare(query).iterate() as IterableIterator<Row>;
  let batch: Row[] = [];
  let importedCount = 0;

  for (const row of iterator) {
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      importedCount += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    importedCount += batch.length;
  }

  console.log(`${tableName}: imported ${importedCount}`);
}

function mapCoursePackRow(row: CoursePackRow) {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    cover: row.cover,
    raw_json: parseRawJson(row.raw_json, "course_packs", row.id),
  };
}

function mapCourseRow(row: CourseRow) {
  return {
    id: row.id,
    course_pack_id: row.course_pack_id,
    title: row.title ?? "",
    description: row.description ?? "",
    display_order: row.display_order ?? 0,
    course_type: row.course_type ?? "normal",
    raw_json: parseRawJson(row.raw_json, "courses", row.id),
  };
}

function mapSentenceRow(row: SentenceRow) {
  return {
    id: row.id,
    course_id: row.course_id,
    content: row.content ?? "",
    english: row.english ?? "",
    chinese: row.chinese ?? "",
    sort_order: row.sort_order ?? 0,
    raw_json: parseRawJson(row.raw_json, "sentences", row.id),
  };
}

function mapStatementRow(row: StatementRow) {
  return {
    id: row.id,
    course_id: row.course_id,
    sentence_id: normalizeNullableText(row.sentence_id),
    chinese: row.chinese ?? "",
    english: row.english ?? "",
    soundmark: row.soundmark ?? "",
    statement_type: row.statement_type ?? "",
    display_order: row.display_order ?? 0,
    raw_json: parseRawJson(row.raw_json, "statements", row.id),
  };
}

function normalizeNullableText(value: string | null) {
  if (!value?.trim()) {
    return null;
  }

  return value;
}

async function insertCoursePacks(sql: PgSql, rows: ReturnType<typeof mapCoursePackRow>[]) {
  await sql`
    insert into course_packs (id, title, description, cover, raw_json)
    select id, title, description, cover, raw_json
    from jsonb_to_recordset(${sql.json(rows)}::jsonb)
      as x(id text, title text, description text, cover text, raw_json jsonb)
  `;
}

async function insertCourses(sql: PgSql, rows: ReturnType<typeof mapCourseRow>[]) {
  await sql`
    insert into courses (id, course_pack_id, title, description, display_order, course_type, raw_json)
    select id, course_pack_id, title, description, display_order, course_type, raw_json
    from jsonb_to_recordset(${sql.json(rows)}::jsonb)
      as x(
        id text,
        course_pack_id text,
        title text,
        description text,
        display_order integer,
        course_type text,
        raw_json jsonb
      )
  `;
}

async function insertSentences(sql: PgSql, rows: ReturnType<typeof mapSentenceRow>[]) {
  await sql`
    insert into sentences (id, course_id, content, english, chinese, sort_order, raw_json)
    select id, course_id, content, english, chinese, sort_order, raw_json
    from jsonb_to_recordset(${sql.json(rows)}::jsonb)
      as x(
        id text,
        course_id text,
        content text,
        english text,
        chinese text,
        sort_order integer,
        raw_json jsonb
      )
  `;
}

async function insertStatements(sql: PgSql, rows: ReturnType<typeof mapStatementRow>[]) {
  await sql`
    insert into statements (
      id,
      course_id,
      sentence_id,
      chinese,
      english,
      soundmark,
      statement_type,
      display_order,
      raw_json
    )
    select
      id,
      course_id,
      sentence_id,
      chinese,
      english,
      soundmark,
      statement_type,
      display_order,
      raw_json
    from jsonb_to_recordset(${sql.json(rows)}::jsonb)
      as x(
        id text,
        course_id text,
        sentence_id text,
        chinese text,
        english text,
        soundmark text,
        statement_type text,
        display_order integer,
        raw_json jsonb
      )
  `;
}

function parseRawJson(value: string, tableName: string, id: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid raw_json in ${tableName}.${id}: ${(error as Error).message}`);
  }
}

function printCounts(label: string, counts: ImportCounts) {
  console.log(label);
  console.log(`course_packs: ${counts.coursePacks}`);
  console.log(`courses: ${counts.courses}`);
  console.log(`sentences: ${counts.sentences}`);
  console.log(`statements: ${counts.statements}`);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
