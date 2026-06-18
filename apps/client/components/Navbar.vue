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
                @click="openAuth('login')"
              >
                <UIcon
                  name="i-ph-sign-in"
                  class="h-4 w-4"
                />
                登录
              </button>
              <button
                class="btn btn-primary btn-sm"
                @click="openAuth('register')"
              >
                注册
              </button>
            </template>
          </nav>
        </div>
      </div>
    </div>

    <dialog
      ref="authDialog"
      class="modal"
    >
      <div class="modal-box max-w-sm rounded-lg">
        <form method="dialog">
          <button class="btn btn-circle btn-ghost btn-sm absolute right-3 top-3">
            <UIcon
              name="i-ph-x"
              class="h-4 w-4"
            />
          </button>
        </form>
        <h2 class="mb-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {{ authMode === "login" ? "登录" : "注册" }}
        </h2>
        <form
          class="space-y-3"
          @submit.prevent="handleSubmit"
        >
          <label
            v-if="authMode === 'register'"
            class="form-control"
          >
            <span class="label-text mb-1">用户名</span>
            <input
              v-model.trim="authForm.username"
              class="input input-sm input-bordered"
              autocomplete="username"
              required
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">手机号</span>
            <input
              v-model.trim="authForm.phone"
              class="input input-sm input-bordered"
              autocomplete="tel"
              required
            />
          </label>
          <label class="form-control">
            <span class="label-text mb-1">密码</span>
            <input
              v-model="authForm.password"
              class="input input-sm input-bordered"
              type="password"
              autocomplete="current-password"
              required
              minlength="6"
            />
          </label>
          <button
            class="btn btn-primary btn-sm mt-2 w-full"
            :disabled="isSubmitting"
          >
            {{ authMode === "login" ? "登录" : "注册" }}
          </button>
        </form>
        <button
          class="btn btn-link btn-sm mt-3 px-0"
          @click="toggleAuthMode"
        >
          {{ authMode === "login" ? "创建账号" : "已有账号登录" }}
        </button>
      </div>
      <form
        method="dialog"
        class="modal-backdrop"
      >
        <button>close</button>
      </form>
    </dialog>
  </header>
</template>

<script setup lang="ts">
import { useWindowScroll } from "@vueuse/core";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

import { useUserStore } from "~/store/user";

const route = useRoute();
const { y } = useWindowScroll();
const userStore = useUserStore();

const SCROLL_THRESHOLD = 8;

const isStickyNavBar = computed(() => route.name === "course-pack");
const isScrolled = computed(() => y.value >= SCROLL_THRESHOLD);

type AuthMode = "login" | "register";

const authDialog = ref<HTMLDialogElement>();
const authMode = ref<AuthMode>("login");
const isSubmitting = ref(false);
const authForm = reactive({
  username: "",
  phone: "",
  password: "",
});

onMounted(() => {
  userStore.loadCurrentUser();
});

function openAuth(mode: AuthMode) {
  authMode.value = mode;
  authDialog.value?.showModal();
}

function toggleAuthMode() {
  authMode.value = authMode.value === "login" ? "register" : "login";
}

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    if (authMode.value === "login") {
      await userStore.login({
        phone: authForm.phone,
        password: authForm.password,
      });
    } else {
      await userStore.register({
        username: authForm.username,
        phone: authForm.phone,
        password: authForm.password,
      });
    }
    authDialog.value?.close();
    authForm.password = "";
  } finally {
    isSubmitting.value = false;
  }
}

async function handleLogout() {
  isSubmitting.value = true;
  try {
    await userStore.logout();
  } finally {
    isSubmitting.value = false;
  }
}
</script>
