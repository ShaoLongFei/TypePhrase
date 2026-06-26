<template>
  <AuthGate @authenticated="setup">
    <div class="flex w-full flex-col">
      <template v-if="isLoading">
        <Loading></Loading>
      </template>

      <template v-else>
        <h2 class="mb-4 text-center text-3xl dark:border-gray-600">
          {{ coursePackStore.currentCoursePack?.title }}
        </h2>
        <div class="mb-4 flex justify-center">
          <div class="inline-flex rounded-md border border-gray-300 p-1 dark:border-gray-700">
            <button
              v-for="option in difficultyOptions"
              :key="option.value"
              class="rounded px-4 py-1.5 text-sm transition-colors"
              :class="
                difficulty === option.value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              "
              @click="difficulty = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="h-full scrollbar-hide">
          <div
            class="grid h-[79vh] grid-cols-1 justify-start gap-8 overflow-y-auto overflow-x-hidden pb-96 pl-0 pr-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <template
              v-for="course in coursePackStore.currentCoursePack?.courses"
              :key="course.id"
            >
              <CoursesCourseCard
                :title="course.title"
                :description="course.description"
                :id="course.id"
                :count="course.completionCount"
                :coursePackId="course.coursePackId"
                @click="handleChangeCourse(course.id)"
              />
            </template>
          </div>
        </div>
      </template>
    </div>
  </AuthGate>
</template>

<script setup lang="ts">
import { navigateTo } from "#app";
import { ref } from "vue";
import { useRoute } from "vue-router";

import type { PracticeDifficulty } from "~/api/course";
import { DEFAULT_PRACTICE_DIFFICULTY, PRACTICE_DIFFICULTIES } from "~/api/course";
import AuthGate from "~/components/auth/AuthGate.vue";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { useCoursePackStore } from "~/store/coursePack";

const isLoading = ref(false);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const coursePackId = route.params.id as string;
const { updateActiveCourseMap } = useActiveCourseMap();
const difficulty = ref(parseDifficulty(route.query.difficulty));
const difficultyOptions: Array<{ label: string; value: PracticeDifficulty }> = [
  { label: "普通", value: "normal" },
  { label: "困难", value: "hard" },
];

async function setup() {
  isLoading.value = true;
  await coursePackStore.setupCoursePack(coursePackId);
  isLoading.value = false;
}

function handleChangeCourse(courseId: string) {
  updateActiveCourseMap(coursePackId, courseId);
  navigateTo({
    path: `/game/${coursePackId}/${courseId}`,
    query: { difficulty: difficulty.value },
  });
}

function parseDifficulty(value: unknown): PracticeDifficulty {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  if (PRACTICE_DIFFICULTIES.includes(normalizedValue as PracticeDifficulty)) {
    return normalizedValue as PracticeDifficulty;
  }
  return DEFAULT_PRACTICE_DIFFICULTY;
}
</script>

<style></style>
