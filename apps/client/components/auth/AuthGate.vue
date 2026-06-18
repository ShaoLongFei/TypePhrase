<template>
  <template v-if="!userStore.isAuthReady || userStore.isLoadingCurrentUser">
    <Loading />
  </template>
  <template v-else-if="userStore.user">
    <slot />
  </template>
  <section
    v-else
    class="flex min-h-[72vh] w-full items-center justify-center px-4"
  >
    <div class="w-full max-w-md text-center">
      <div
        class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-950"
      >
        <UIcon
          name="i-ph-lock-key"
          class="h-7 w-7"
        />
      </div>
      <h2 class="text-2xl font-semibold text-slate-900 dark:text-white">登录后继续学习</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        课程内容、学习进度和已掌握状态都会保存在你的账号里。
      </p>
      <div class="mt-6 flex items-center justify-center gap-3">
        <button
          class="btn btn-primary rounded-md"
          @click="userStore.openAuth('login')"
        >
          <UIcon
            name="i-ph-sign-in"
            class="h-4 w-4"
          />
          登录
        </button>
        <button
          class="btn btn-outline rounded-md"
          @click="userStore.openAuth('register')"
        >
          注册
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";

import { useUserStore } from "~/store/user";

const emit = defineEmits<{
  authenticated: [];
}>();

const userStore = useUserStore();
let hasEmittedAuthenticated = false;

onMounted(async () => {
  await userStore.loadCurrentUser();
  emitAuthenticated();
});

watch(
  () => userStore.user,
  () => emitAuthenticated(),
);

function emitAuthenticated() {
  if (!userStore.user || hasEmittedAuthenticated) return;

  hasEmittedAuthenticated = true;
  emit("authenticated");
}
</script>
