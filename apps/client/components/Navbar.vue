<template>
  <header
    class="w-full px-5 font-customFont transition-all duration-300 ease-linear"
    :class="{
      'sticky top-0 z-10': isStickyNavBar,
      'glass bg-gradient-to-r from-transparent via-white/10 to-transparent shadow-md':
        isStickyNavBar && isScrolled,
    }"
  >
    <div class="mx-auto max-w-screen-xl">
      <div class="flex h-16 items-center justify-between">
        <div class="flex flex-1 items-center justify-between">
          <NuxtLink to="/course-pack">
            <div class="logo flex items-center">
              <img
                width="48"
                height="48"
                class="mr-6 hidden overflow-hidden rounded-md md:block"
                src="/logo.png"
                alt="typephrase-logo"
              />
              <h1 class="text-wrap text-2xl font-extrabold leading-normal dark:text-white">
                TypePhrase
              </h1>
            </div>
          </NuxtLink>

          <nav
            aria-label="Global"
            class="ml-6 flex items-center gap-3"
          >
            <template v-if="userStore.user">
              <span
                class="hidden max-w-40 truncate text-sm text-slate-500 dark:text-slate-300 sm:inline"
              >
                {{ userStore.user.username }}
              </span>
              <button
                class="btn btn-ghost btn-sm"
                :disabled="isSubmitting"
                @click="handleLogout"
              >
                <UIcon
                  name="i-ph-sign-out"
                  class="h-4 w-4"
                />
                退出
              </button>
            </template>
            <template v-else>
              <button
                class="btn btn-outline btn-sm"
                @click="userStore.openAuth('login')"
              >
                <UIcon
                  name="i-ph-sign-in"
                  class="h-4 w-4"
                />
                登录
              </button>
              <button
                class="btn btn-primary btn-sm"
                @click="userStore.openAuth('register')"
              >
                注册
              </button>
            </template>
          </nav>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useWindowScroll } from "@vueuse/core";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { useUserStore } from "~/store/user";

const route = useRoute();
const { y } = useWindowScroll();
const userStore = useUserStore();

const SCROLL_THRESHOLD = 8;

const isStickyNavBar = computed(() => route.name === "course-pack");
const isScrolled = computed(() => y.value >= SCROLL_THRESHOLD);
const isSubmitting = ref(false);

onMounted(() => {
  userStore.loadCurrentUser();
});

async function handleLogout() {
  isSubmitting.value = true;
  try {
    await userStore.logout();
  } finally {
    isSubmitting.value = false;
  }
}
</script>
