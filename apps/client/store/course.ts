import { defineStore } from "pinia";
import { computed, ref, watchEffect } from "vue";

import type { PracticeDifficulty } from "~/api/course";
import type { Course, PracticeItem } from "~/types";
import { DEFAULT_PRACTICE_DIFFICULTY, fetchCompleteCourse, fetchCourse } from "~/api/course";
import { fetchAddMasteredElement } from "~/api/mastered-elements";
import { fetchUpsertUserCourseProgress } from "~/api/user-course-progress";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { usePractice } from "./practice";

export const useCourseStore = defineStore("course", () => {
  const currentCourse = ref<Course>();
  const currentPracticeItem = ref<PracticeItem>();
  const { practiceIndex } = usePractice();

  const { updateActiveCourseMap } = useActiveCourseMap();

  watchEffect(() => {
    currentPracticeItem.value = currentCourse.value?.practiceItems[practiceIndex.value];
  });

  const words = computed(() => {
    return currentPracticeItem.value?.english.split(" ") || [];
  });

  const visiblePracticeItemsCount = computed(
    () => currentCourse.value?.practiceItems.filter((item) => !item.isMastered).length || 0,
  );

  const visiblePracticeItemIndex = computed(() => {
    let masteredCount = 0;
    currentCourse.value?.practiceItems.forEach((practiceItem, index) => {
      if (index < practiceIndex.value) {
        if (practiceItem.isMastered) {
          masteredCount++;
        }
      }
    });

    if (practiceIndex.value - masteredCount >= visiblePracticeItemsCount.value) {
      return practiceIndex.value - masteredCount - 1;
    }

    return practiceIndex.value - masteredCount;
  });

  const totalQuestionsCount = computed(() => {
    return currentCourse.value?.practiceItems.length || 0;
  });

  function toSpecificPracticeItem(index: number) {
    practiceIndex.value = index;
    saveProgress();
  }

  function findNextUnmasteredIndex(currentIndex: number, direction: 1 | -1) {
    let index = currentIndex;
    while (index >= 0 && index < totalQuestionsCount.value) {
      index += direction;
      if (
        index >= 0 &&
        index < totalQuestionsCount.value &&
        !currentCourse.value!.practiceItems[index].isMastered
      ) {
        return index;
      }
    }
    return -1;
  }

  function toPreviousPracticeItem() {
    const prevIndex = findNextUnmasteredIndex(practiceIndex.value, -1);
    if (prevIndex !== -1) {
      practiceIndex.value = prevIndex;
      saveProgress();
    }
  }

  function toNextPracticeItem() {
    const nextIndex = findNextUnmasteredIndex(practiceIndex.value, 1);
    if (nextIndex !== -1) {
      practiceIndex.value = nextIndex;
      saveProgress();
    }
  }

  function resetPracticeIndex() {
    const firstIndex = findFirstUnmasteredIndex();
    if (firstIndex !== -1) {
      practiceIndex.value = firstIndex;
    }
  }

  function isAllDone() {
    return visiblePracticeItemIndex.value >= visiblePracticeItemsCount.value - 1;
  }

  function isLastPracticeItem() {
    return visiblePracticeItemIndex.value + 1 === visiblePracticeItemsCount.value;
  }

  function isAllMastered() {
    return visiblePracticeItemsCount.value === 0;
  }

  function findFirstUnmasteredIndex() {
    if (!currentCourse.value) return 0;
    return currentCourse.value.practiceItems.findIndex((practiceItem) => !practiceItem.isMastered);
  }

  function doAgain() {
    resetPracticeIndex();
    updateActiveCourseMap(currentCourse.value?.coursePackId!, currentCourse.value?.id!);
    saveProgress();
  }

  async function completeCourse(stats: { duration?: number; count?: number } = {}) {
    const coursePackId = currentCourse.value?.coursePackId!;
    const difficulty = currentCourse.value?.difficulty ?? DEFAULT_PRACTICE_DIFFICULTY;
    const res = await fetchCompleteCourse(coursePackId, currentCourse.value?.id!, {
      ...stats,
      difficulty,
      completedAt: new Date().toISOString(),
    });
    return res;
  }

  async function markCurrentPracticeItemMastered() {
    if (!currentCourse.value || !currentPracticeItem.value) return;

    const currentIndex = practiceIndex.value;
    await fetchAddMasteredElement({
      sourceType: currentPracticeItem.value.sourceType,
      sourceId: currentPracticeItem.value.id,
      english: currentPracticeItem.value.english,
      chinese: currentPracticeItem.value.chinese,
    });
    currentCourse.value.practiceItems[currentIndex].isMastered = true;

    const nextIndex = findNextUnmasteredIndex(currentIndex, 1);
    if (nextIndex !== -1) {
      practiceIndex.value = nextIndex;
      saveProgress();
      return;
    }

    const previousIndex = findNextUnmasteredIndex(currentIndex, -1);
    if (previousIndex !== -1) {
      practiceIndex.value = previousIndex;
      saveProgress();
    }
  }

  async function setup(
    coursePackId: string,
    courseId: string,
    difficulty: PracticeDifficulty = DEFAULT_PRACTICE_DIFFICULTY,
  ) {
    const course = await fetchCourse(coursePackId, courseId, difficulty);

    currentCourse.value = {
      ...course,
      difficulty: course.difficulty ?? difficulty,
    };
    if (course.practiceIndex > 0 && course.practiceIndex < course.practiceItems.length) {
      practiceIndex.value = course.practiceIndex;
    } else {
      resetPracticeIndex();
    }
  }

  function saveProgress() {
    if (!currentCourse.value) return;

    void fetchUpsertUserCourseProgress({
      coursePackId: currentCourse.value.coursePackId,
      courseId: currentCourse.value.id,
      difficulty: currentCourse.value.difficulty,
      practiceIndex: practiceIndex.value,
    }).catch(() => undefined);
  }

  return {
    practiceIndex,
    currentCourse,
    currentPracticeItem,
    words,
    totalQuestionsCount,
    visiblePracticeItemIndex,
    visiblePracticeItemsCount,
    setup,
    doAgain,
    isAllDone,
    completeCourse,
    markCurrentPracticeItemMastered,
    toSpecificPracticeItem,
    toPreviousPracticeItem,
    toNextPracticeItem,
    resetPracticeIndex,
    isLastPracticeItem,
    isAllMastered,
  };
});
