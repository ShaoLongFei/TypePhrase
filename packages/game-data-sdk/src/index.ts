import { setupDB } from "./db";

export * from "./course-pack/course-pack.model";
export * from "./course-pack/course-pack.service";

interface Options {
  dataBaseURL: string;
}
export function setupGameDataSDK(options: Options) {
  setupDB(options.dataBaseURL);
}
