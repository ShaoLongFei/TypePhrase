export interface ParsedManyThingsStatement {
  chinese: string;
  english: string;
  attribution: string;
  wordCount: number;
  soundmark?: string;
}

export interface ImportStatement {
  id: string;
  order: number;
  chinese: string;
  english: string;
  soundmark: string;
}

export interface ImportCourse {
  id: string;
  title: string;
  description: string;
  video: string;
  order: number;
  statements: ImportStatement[];
}

export interface ImportCoursePack {
  id: string;
  title: string;
  description: string;
  cover: string;
  order: number;
  creatorId: string;
  shareLevel: "public";
  isFree: true;
  courses: ImportCourse[];
}

interface ParseOptions {
  minWords?: number;
  maxWords?: number;
  maxChineseLength?: number;
}

interface BuildOptions {
  baseOrder?: number;
  creatorId?: string;
  lessonSize?: number;
}

const DEFAULT_MAX_WORDS = 24;
const DEFAULT_LESSON_SIZE = 100;
const BASE_PACK_ID = "typephrase_tatoeba_cmn_eng";

const DIFFICULTY_GROUPS = [
  {
    id: `${BASE_PACK_ID}_short`,
    title: "Tatoeba 中英短句训练",
    description: "1-6 个英文词，适合热身和基础表达。",
    minWords: 1,
    maxWords: 6,
  },
  {
    id: `${BASE_PACK_ID}_medium`,
    title: "Tatoeba 中英常用句训练",
    description: "7-12 个英文词，覆盖更完整的日常句子。",
    minWords: 7,
    maxWords: 12,
  },
  {
    id: `${BASE_PACK_ID}_long`,
    title: "Tatoeba 中英长句训练",
    description: "13-24 个英文词，保留较长表达用于进阶练习。",
    minWords: 13,
    maxWords: 24,
  },
] as const;

export const TATOEBA_MANYTHINGS_PACK_IDS = DIFFICULTY_GROUPS.map((group) => group.id);

export function normalizeEnglishForTyping(english: string): string | null {
  const normalized = english
    .normalize("NFKC")
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, "")
    .replace(/[‐‑‒–—―-]/g, " ")
    .replace(/[.,!?;:，。！？；：、…·()[\]{}<>《》"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || !/[A-Za-z0-9]/.test(normalized)) {
    return null;
  }

  if (/[^A-Za-z0-9' ]/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function parseManyThingsText(
  text: string,
  { minWords = 1, maxWords = DEFAULT_MAX_WORDS, maxChineseLength = 220 }: ParseOptions = {},
): ParsedManyThingsStatement[] {
  const seenEnglish = new Set<string>();
  const statements: ParsedManyThingsStatement[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const [rawEnglish, rawChinese, ...rawAttributionParts] = line.split("\t");
    if (!rawEnglish || !rawChinese || rawAttributionParts.length === 0) continue;

    const english = normalizeEnglishForTyping(rawEnglish);
    const chinese = rawChinese.normalize("NFKC").trim();
    if (!english || !chinese || chinese.length > maxChineseLength) continue;

    const words = english.split(" ").filter(Boolean);
    if (words.length < minWords || words.length > maxWords) continue;

    const dedupeKey = english.toLowerCase();
    if (seenEnglish.has(dedupeKey)) continue;
    seenEnglish.add(dedupeKey);

    statements.push({
      chinese,
      english,
      attribution: rawAttributionParts.join("\t").trim(),
      wordCount: words.length,
    });
  }

  return statements;
}

export function buildCoursePacks(
  statements: ParsedManyThingsStatement[],
  { baseOrder = 2, creatorId = "1", lessonSize = DEFAULT_LESSON_SIZE }: BuildOptions = {},
): ImportCoursePack[] {
  return DIFFICULTY_GROUPS.map((group, groupIndex) => {
    const groupStatements = statements.filter(
      (statement) => statement.wordCount >= group.minWords && statement.wordCount <= group.maxWords,
    );

    return {
      id: group.id,
      title: group.title,
      description: [
        group.description,
        "来源：ManyThings / Tatoeba cmn-eng，按 CC-BY 2.0 France 使用；英文已按 TypePhrase 输入规则移除句读标点。",
      ].join(" "),
      cover: "",
      order: baseOrder + groupIndex,
      creatorId,
      shareLevel: "public",
      isFree: true,
      courses: chunk(groupStatements, lessonSize).map((lessonStatements, lessonIndex) => {
        const courseId = `${group.id}_${padNumber(lessonIndex + 1)}`;
        const start = lessonIndex * lessonSize + 1;
        const end = start + lessonStatements.length - 1;

        return {
          id: courseId,
          title: `第 ${lessonIndex + 1} 课`,
          description: `${group.description} 第 ${start}-${end} 句。`,
          video: "",
          order: lessonIndex + 1,
          statements: lessonStatements.map((statement, statementIndex) => ({
            id: `${courseId}_${padNumber(statementIndex + 1)}`,
            order: statementIndex + 1,
            chinese: statement.chinese,
            english: statement.english,
            soundmark: statement.soundmark ?? "",
          })),
        };
      }),
    };
  }).filter((pack) => pack.courses.length > 0);
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function padNumber(value: number): string {
  return value.toString().padStart(3, "0");
}
