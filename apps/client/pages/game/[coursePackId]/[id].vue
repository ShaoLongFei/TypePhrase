<template>
  <AuthGate @authenticated="setup">
    <div class="flex w-full flex-col pt-2">
      <template v-if="isLoading">
        <Loading></Loading>
      </template>
      <template v-else>
        <MainTool />
        <MainGame />
      </template>
    </div>
  </AuthGate>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

import type { PracticeDifficulty } from "~/api/course";
import { DEFAULT_PRACTICE_DIFFICULTY, PRACTICE_DIFFICULTIES } from "~/api/course";
import AuthGate from "~/components/auth/AuthGate.vue";
import { useGameMode } from "~/composables/main/game";
import { useNavigation } from "~/composables/useNavigation";
import { useCourseStore } from "~/store/course";
import { useCoursePackStore } from "~/store/coursePack";

const isLoading = ref(true);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const courseStore = useCourseStore();
const { gotoCourseList } = useNavigation();
const { showQuestion } = useGameMode();

showQuestion();

async function setup() {
  const { coursePackId, id } = route.params;
  const difficulty = parseDifficulty(route.query.difficulty);
  await courseStore.setup(coursePackId as string, id as string, difficulty);
  await coursePackStore.setupCoursePack(coursePackId as string);

  if (courseStore.isAllMastered()) {
    toast.info("你已经全部都掌握 自动帮你跳转到课程列表啦", {
      duration: 1500,
      onAutoClose: () => {
        gotoCourseList(coursePackId as string);
      },
    });
    return;
  }
  isLoading.value = false;
}

function parseDifficulty(value: unknown): PracticeDifficulty {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  if (PRACTICE_DIFFICULTIES.includes(normalizedValue as PracticeDifficulty)) {
    return normalizedValue as PracticeDifficulty;
  }
  return DEFAULT_PRACTICE_DIFFICULTY;
}
</script>
