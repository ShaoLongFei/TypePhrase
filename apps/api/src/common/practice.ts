import { BadRequestException } from "@nestjs/common";

export const PRACTICE_DIFFICULTIES = ["normal", "hard"] as const;
export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];
export type PracticeSourceType = "statement" | "sentence";

export const DEFAULT_PRACTICE_DIFFICULTY: PracticeDifficulty = "normal";

export function parsePracticeDifficulty(value?: string | null): PracticeDifficulty {
  if (!value) return DEFAULT_PRACTICE_DIFFICULTY;
  if (value === "normal" || value === "hard") return value;
  throw new BadRequestException("difficulty must be normal or hard");
}
