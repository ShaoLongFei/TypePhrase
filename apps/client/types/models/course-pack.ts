import type { Course } from "./course";

export type CoursePacksItem = {
  id: string;
  title: string;
  description: string;
  cover: string;
};

export type CoursePack = {
  id: string;
  title: string;
  description: string;
  cover: string;
  courses: Course[];
};
