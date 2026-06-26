import type { CourseApiResponse, PracticeItemApiResponse } from "~/api/course";

export interface PracticeItem extends PracticeItemApiResponse {}
export interface Course extends CourseApiResponse {
  practiceItems: PracticeItem[];
}
