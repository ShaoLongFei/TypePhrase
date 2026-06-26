import type { PracticeDifficulty } from "./course";
import { getHttp } from "./http";

export interface UpsertUserCourseProgressPayload {
  coursePackId: string;
  courseId: string;
  difficulty: PracticeDifficulty;
  practiceIndex: number;
}

export async function fetchUpsertUserCourseProgress(payload: UpsertUserCourseProgressPayload) {
  const http = getHttp();
  return http<void>("/user-course-progress", {
    method: "put",
    body: payload,
  });
}
