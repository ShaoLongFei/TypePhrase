import { spawnSync } from "node:child_process";
import fs from "node:fs";

import { eq } from "drizzle-orm";

import {
  coursePack as coursePackSchema,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";
import type { ImportCoursePack, ParsedManyThingsStatement } from "./tatoebaManythings";
import {
  buildCoursePacks,
  parseManyThingsText,
  TATOEBA_MANYTHINGS_PACK_IDS,
} from "./tatoebaManythings";

interface CliOptions {
  source: string;
  replace: boolean;
  dryRun: boolean;
  noSoundmark: boolean;
  lessonSize: number;
  maxWords: number;
  baseOrder: number;
}

const DEFAULT_OPTIONS: CliOptions = {
  source: "",
  replace: false,
  dryRun: false,
  noSoundmark: false,
  lessonSize: 100,
  maxWords: 24,
  baseOrder: 2,
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.source) {
    throw new Error("请通过 --source 指定 ManyThings cmn.txt 文件路径");
  }

  const rawText = fs.readFileSync(options.source, "utf-8");
  const statements = parseManyThingsText(rawText, { maxWords: options.maxWords });
  await addSoundmarks(statements, options.noSoundmark);

  const packs = buildCoursePacks(statements, {
    baseOrder: options.baseOrder,
    lessonSize: options.lessonSize,
  });

  printSummary(packs, options);

  if (options.dryRun) {
    return;
  }

  if (!options.replace) {
    throw new Error("正式导入需要显式传入 --replace，用于替换本脚本管理的 Tatoeba 课程包");
  }

  const { db } = await import("@earthworm/db");
  await db.transaction(async (tx) => {
    await deleteManagedCoursePacks(tx);
    await insertCoursePacks(tx, packs);
  });

  console.log("Tatoeba / ManyThings 课程包导入完成");
}

function parseArgs(argv: string[]): CliOptions {
  const options = { ...DEFAULT_OPTIONS };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    } else if (arg === "--replace") {
      options.replace = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-soundmark") {
      options.noSoundmark = true;
    } else if (arg === "--source") {
      options.source = argv[++index] ?? "";
    } else if (arg === "--lesson-size") {
      options.lessonSize = Number(argv[++index]);
    } else if (arg === "--max-words") {
      options.maxWords = Number(argv[++index]);
    } else if (arg === "--base-order") {
      options.baseOrder = Number(argv[++index]);
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }

  if (!Number.isInteger(options.lessonSize) || options.lessonSize <= 0) {
    throw new Error("--lesson-size 必须是正整数");
  }

  if (!Number.isInteger(options.maxWords) || options.maxWords <= 0) {
    throw new Error("--max-words 必须是正整数");
  }

  if (!Number.isInteger(options.baseOrder) || options.baseOrder <= 0) {
    throw new Error("--base-order 必须是正整数");
  }

  return options;
}

async function addSoundmarks(statements: ParsedManyThingsStatement[], noSoundmark: boolean) {
  if (noSoundmark) {
    statements.forEach((statement) => {
      statement.soundmark = "";
    });
    return;
  }

  let espeakUnavailable = false;
  for (const [index, statement] of statements.entries()) {
    if (espeakUnavailable) {
      statement.soundmark = "";
      continue;
    }

    const result = generateSoundmark(statement.english);
    statement.soundmark = result.soundmark;
    espeakUnavailable = result.espeakUnavailable;

    if ((index + 1) % 500 === 0) {
      console.log(`已生成音标：${index + 1}/${statements.length}`);
    }
  }
}

function generateSoundmark(english: string): { soundmark: string; espeakUnavailable: boolean } {
  const result = spawnSync("espeak-ng", ["-q", "--ipa=3", "-v", "en-us", english], {
    encoding: "utf-8",
  });

  if (result.error) {
    console.warn("未找到 espeak-ng，后续音标将写为空字符串");
    return { soundmark: "", espeakUnavailable: true };
  }

  if (result.status !== 0) {
    console.warn(`生成音标失败：${english}`);
    return { soundmark: "", espeakUnavailable: false };
  }

  const ipa = result.stdout.trim().replace(/\s+/g, " ");
  return { soundmark: ipa ? `/${ipa}/` : "", espeakUnavailable: false };
}

async function deleteManagedCoursePacks(tx: any) {
  for (const coursePackId of TATOEBA_MANYTHINGS_PACK_IDS) {
    const courses = await tx.query.course.findMany({
      where: eq(courseSchema.coursePackId, coursePackId),
    });

    for (const course of courses) {
      await tx.delete(statementSchema).where(eq(statementSchema.courseId, course.id));
    }

    await tx.delete(courseSchema).where(eq(courseSchema.coursePackId, coursePackId));
    await tx.delete(coursePackSchema).where(eq(coursePackSchema.id, coursePackId));
  }
}

async function insertCoursePacks(tx: any, packs: ImportCoursePack[]) {
  for (const pack of packs) {
    await tx.insert(coursePackSchema).values({
      id: pack.id,
      order: pack.order,
      title: pack.title,
      description: pack.description,
      creatorId: pack.creatorId,
      shareLevel: pack.shareLevel,
      isFree: pack.isFree,
      cover: pack.cover,
    });

    for (const course of pack.courses) {
      await tx.insert(courseSchema).values({
        id: course.id,
        title: course.title,
        description: course.description,
        video: course.video,
        order: course.order,
        coursePackId: pack.id,
      });

      for (const statements of chunk(course.statements, 500)) {
        await tx.insert(statementSchema).values(
          statements.map((statement) => ({
            id: statement.id,
            order: statement.order,
            chinese: statement.chinese,
            english: statement.english,
            soundmark: statement.soundmark,
            courseId: course.id,
          })),
        );
      }
    }
  }
}

function printSummary(packs: ImportCoursePack[], options: CliOptions) {
  const statementCount = packs.reduce(
    (total, pack) =>
      total +
      pack.courses.reduce((courseTotal, course) => courseTotal + course.statements.length, 0),
    0,
  );
  const courseCount = packs.reduce((total, pack) => total + pack.courses.length, 0);

  console.log(
    JSON.stringify(
      {
        source: options.source,
        dryRun: options.dryRun,
        replace: options.replace,
        maxWords: options.maxWords,
        lessonSize: options.lessonSize,
        packs: packs.map((pack) => ({
          id: pack.id,
          title: pack.title,
          courses: pack.courses.length,
          statements: pack.courses.reduce((total, course) => total + course.statements.length, 0),
        })),
        totalCourses: courseCount,
        totalStatements: statementCount,
      },
      null,
      2,
    ),
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
