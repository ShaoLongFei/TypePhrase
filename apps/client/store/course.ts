import { defineStore } from "pinia";
import { computed, ref, watchEffect } from "vue";

import type { Course, Statement } from "~/types";
import { fetchCompleteCourse, fetchCourse } from "~/api/course";
import { fetchAddMasteredElement } from "~/api/mastered-elements";
import { fetchUpsertUserCourseProgress } from "~/api/user-course-progress";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { useStatement } from "./statement";

export const useCourseStore = defineStore("course", () => {
  const currentCourse = ref<Course>();
  const currentStatement = ref<Statement>();
  const { statementIndex } = useStatement();

  const { updateActiveCourseMap } = useActiveCourseMap();

  watchEffect(() => {
    currentStatement.value = currentCourse.value?.statements[statementIndex.value];
  });

  const words = computed(() => {
    return currentStatement.value?.english.split(" ") || [];
  });

  const visibleStatementsCount = computed(
    () => currentCourse.value?.statements.filter((s) => !s.isMastered).length || 0,
  );

  const visibleStatementIndex = computed(() => {
    let masteredCount = 0;
    currentCourse.value?.statements.forEach((statement, index) => {
      if (index < statementIndex.value) {
        if (statement.isMastered) {
          masteredCount++;
        }
      }
    });

    if (statementIndex.value - masteredCount >= visibleStatementsCount.value) {
      return statementIndex.value - masteredCount - 1;
    }

    return statementIndex.value - masteredCount;
  });

  const totalQuestionsCount = computed(() => {
    return currentCourse.value?.statements.length || 0;
  });

  function toSpecificStatement(index: number) {
    statementIndex.value = index;
    saveProgress();
  }

  function findNextUnmasteredIndex(currentIndex: number, direction: 1 | -1) {
    let index = currentIndex;
    while (index >= 0 && index < totalQuestionsCount.value) {
      index += direction;
      if (
        index >= 0 &&
        index < totalQuestionsCount.value &&
        !currentCourse.value!.statements[index].isMastered
      ) {
        return index;
      }
    }
    return -1; // 没有找到未掌握的元素
  }

  function toPreviousStatement() {
    const prevIndex = findNextUnmasteredIndex(statementIndex.value, -1);
    if (prevIndex !== -1) {
      statementIndex.value = prevIndex;
      saveProgress();
    }
  }

  function toNextStatement() {
    const nextIndex = findNextUnmasteredIndex(statementIndex.value, 1);
    if (nextIndex !== -1) {
      statementIndex.value = nextIndex;
      saveProgress();
    }
  }

  function resetStatementIndex() {
    const firstIndex = findFirstUnmasteredIndex();
    if (firstIndex !== -1) {
      statementIndex.value = firstIndex;
    }
  }

  function isAllDone() {
    return visibleStatementIndex.value >= visibleStatementsCount.value - 1;
  }

  function isLastStatement() {
    return visibleStatementIndex.value + 1 === visibleStatementsCount.value;
  }

  function isAllMastered() {
    return visibleStatementsCount.value === 0;
  }

  function findFirstUnmasteredIndex() {
    if (!currentCourse.value) return 0;
    return currentCourse.value.statements.findIndex((statement) => !statement.isMastered);
  }

  function doAgain() {
    resetStatementIndex();
    updateActiveCourseMap(currentCourse.value?.coursePackId!, currentCourse.value?.id!);
    saveProgress();
  }

  async function completeCourse(stats: { duration?: number; count?: number } = {}) {
    const coursePackId = currentCourse.value?.coursePackId!;
    const res = await fetchCompleteCourse(coursePackId, currentCourse.value?.id!, {
      ...stats,
      completedAt: new Date().toISOString(),
    });
    return res;
  }

  async function markCurrentStatementMastered() {
    if (!currentCourse.value || !currentStatement.value) return;

    const currentIndex = statementIndex.value;
    await fetchAddMasteredElement({ english: currentStatement.value.english });
    currentCourse.value.statements[currentIndex].isMastered = true;

    const nextIndex = findNextUnmasteredIndex(currentIndex, 1);
    if (nextIndex !== -1) {
      statementIndex.value = nextIndex;
      saveProgress();
      return;
    }

    const previousIndex = findNextUnmasteredIndex(currentIndex, -1);
    if (previousIndex !== -1) {
      statementIndex.value = previousIndex;
      saveProgress();
    }
  }

  async function setup(coursePackId: string, courseId: string) {
    let course = await fetchCourse(coursePackId, courseId);

    currentCourse.value = course;
    if (course.statementIndex > 0 && course.statementIndex < course.statements.length) {
      statementIndex.value = course.statementIndex;
    } else {
      resetStatementIndex();
    }
  }

  function saveProgress() {
    if (!currentCourse.value) return;

    void fetchUpsertUserCourseProgress({
      coursePackId: currentCourse.value.coursePackId,
      courseId: currentCourse.value.id,
      statementIndex: statementIndex.value,
    }).catch(() => undefined);
  }

  return {
    statementIndex,
    currentCourse,
    currentStatement,
    words,
    totalQuestionsCount,
    visibleStatementIndex,
    visibleStatementsCount,
    setup,
    doAgain,
    isAllDone,
    completeCourse,
    markCurrentStatementMastered,
    toSpecificStatement,
    toPreviousStatement,
    toNextStatement,
    resetStatementIndex,
    isLastStatement,
    isAllMastered,
  };
});
