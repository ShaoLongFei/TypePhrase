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
  await courseStore.setup(coursePackId as string, id as string);
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
</script>
