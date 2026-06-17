<template>
  <div class="font-customFont">
    <LandingBanner @start-typephrase="startTypePhrase" />
    <LandingFeatures />
    <LandingComments />
    <LandingQuestions />
    <LandingContact />
    <CommonBackTop class="sticky bottom-28 ml-auto flex justify-end sm:block" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import { isAuthenticated } from "~/services/auth";
import { cancelShortcut, registerShortcut } from "~/utils/keyboardShortcuts";

const { startTypePhrase } = useShortcutToGame();

function useShortcutToGame() {
  const router = useRouter();

  async function startTypePhrase() {
    if (!isAuthenticated()) {
      router.push(`/course-pack`);
    }
  }

  onMounted(() => {
    registerShortcut("enter", startTypePhrase);
  });

  onUnmounted(() => {
    cancelShortcut("enter", startTypePhrase);
  });

  return {
    startTypePhrase,
  };
}
</script>
