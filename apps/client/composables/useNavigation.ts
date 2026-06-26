import { navigateTo } from "#app";

import type { PracticeDifficulty } from "~/api/course";

export function useNavigation() {
  function gotoCourseList(coursePackId: string, difficulty?: PracticeDifficulty) {
    navigateTo({
      path: `/course-pack/${coursePackId}`,
      query: difficulty ? { difficulty } : undefined,
    });
  }

  function gotoGame(coursePackId: string, courseId: string, difficulty?: PracticeDifficulty) {
    navigateTo({
      path: `/game/${coursePackId}/${courseId}`,
      query: difficulty ? { difficulty } : undefined,
    });
  }

  return {
    gotoCourseList,
    gotoGame,
  };
}
