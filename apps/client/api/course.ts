import { type Course } from "~/types";
import { getHttp } from "./http";

export const PRACTICE_DIFFICULTIES = ["normal", "hard"] as const;
export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];
export const DEFAULT_PRACTICE_DIFFICULTY: PracticeDifficulty = "normal";

export interface PracticeItemApiResponse {
  id: string;
  sourceType: "statement" | "sentence";
  order: number;
  chinese: string;
  english: string;
  soundmark: string;
  itemType: string;
  isMastered: boolean;
}

export interface CourseApiResponse {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  practiceItems: PracticeItemApiResponse[];
  coursePackId: string;
  completionCount: number;
  practiceIndex: number;
  difficulty: PracticeDifficulty;
  courseType: string;
}

export async function fetchCourse(
  coursePackId: string,
  courseId: string,
  difficulty: PracticeDifficulty = DEFAULT_PRACTICE_DIFFICULTY,
) {
  const http = getHttp();
  return (await http<CourseApiResponse>(
    `course-pack/${coursePackId}/courses/${courseId}?difficulty=${difficulty}`,
    {
      method: "get",
    },
  )) as Course;
}

type CompleteCourseResponse = { nextCourse: CourseApiResponse | undefined };
export interface CompleteCoursePayload {
  duration?: number;
  count?: number;
  completedAt?: string;
  difficulty?: PracticeDifficulty;
}

export async function fetchCompleteCourse(
  coursePackId: string,
  courseId: string,
  payload: CompleteCoursePayload = {},
) {
  const http = getHttp();
  const difficulty = payload.difficulty ?? DEFAULT_PRACTICE_DIFFICULTY;
  return transformerFetchCompleteCourse(
    await http<CompleteCourseResponse>(
      `/course-pack/${coursePackId}/courses/${courseId}/complete?difficulty=${difficulty}`,
      { method: "post", body: payload },
    ),
  );
}

function transformerFetchCompleteCourse(apiResponse: CompleteCourseResponse): {
  nextCourse: Course | undefined;
} {
  return {
    nextCourse: apiResponse.nextCourse as Course,
  };
}
