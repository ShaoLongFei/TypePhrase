<template>
  <div>
    <MainQuestionInput />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

import { useCurrentPracticeItemEnglishSound } from "~/composables/main/englishSound";
import { useCourseStore } from "~/store/course";

usePlayEnglishSound();
const { playSound } = useCurrentPracticeItemEnglishSound();

function usePlayEnglishSound() {
  onMounted(() => {
    const pauseSound = playSound();
    const courseStore = useCourseStore();

    watch(
      () => courseStore.practiceIndex,
      () => {
        pauseSound();
        playSound();
      },
    );

    onUnmounted(() => {
      pauseSound();
    });
  });
}
</script>
