import { getHttp } from "./http";

export interface UpsertUserCourseProgressPayload {
  coursePackId: string;
  courseId: string;
  statementIndex: number;
}

export async function fetchUpsertUserCourseProgress(payload: UpsertUserCourseProgressPayload) {
  const http = getHttp();
  return http<void>("/user-course-progress", {
    method: "put",
    body: payload,
  });
}
