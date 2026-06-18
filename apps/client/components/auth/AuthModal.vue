<template>
  <dialog
    ref="authDialog"
    class="modal"
  >
    <div
      class="modal-box w-[min(92vw,28rem)] rounded-lg border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <div class="border-b border-slate-100 px-6 pb-4 pt-5 dark:border-slate-800">
        <form method="dialog">
          <button
            class="btn btn-circle btn-ghost btn-sm absolute right-3 top-3"
            @click.prevent="userStore.closeAuth"
          >
            <UIcon
              name="i-ph-x"
              class="h-4 w-4"
            />
          </button>
        </form>
        <div class="flex items-center gap-3">
          <img
            width="40"
            height="40"
            class="rounded-md"
            src="/logo.png"
            alt="typephrase-logo"
          />
          <div>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-50">TypePhrase</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ userStore.authMode === "login" ? "欢迎回来" : "创建账号" }}
            </p>
          </div>
        </div>
      </div>

      <div class="px-6 py-5">
        <div class="mb-5 grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
          <button
            class="btn btn-sm border-0"
            :class="
              userStore.authMode === 'login'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                : 'btn-ghost text-slate-500'
            "
            @click="userStore.setAuthMode('login')"
          >
            登录
          </button>
          <button
            class="btn btn-sm border-0"
            :class="
              userStore.authMode === 'register'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                : 'btn-ghost text-slate-500'
            "
            @click="userStore.setAuthMode('register')"
          >
            注册
          </button>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <label
            v-if="userStore.authMode === 'register'"
            class="form-control"
          >
            <span class="label-text mb-1.5 text-slate-600 dark:text-slate-300">用户名</span>
            <div class="input input-bordered flex h-11 items-center gap-2 rounded-md">
              <UIcon
                name="i-ph-user"
                class="h-5 w-5 text-slate-400"
              />
              <input
                v-model.trim="authForm.username"
                class="w-full bg-transparent outline-none"
                autocomplete="username"
                required
              />
            </div>
          </label>

          <label class="form-control">
            <span class="label-text mb-1.5 text-slate-600 dark:text-slate-300">手机号</span>
            <div class="input input-bordered flex h-11 items-center gap-2 rounded-md">
              <UIcon
                name="i-ph-device-mobile"
                class="h-5 w-5 text-slate-400"
              />
              <input
                v-model.trim="authForm.phone"
                class="w-full bg-transparent outline-none"
                autocomplete="tel"
                required
              />
            </div>
          </label>

          <label class="form-control">
            <span class="label-text mb-1.5 text-slate-600 dark:text-slate-300">密码</span>
            <div class="input input-bordered flex h-11 items-center gap-2 rounded-md">
              <UIcon
                name="i-ph-lock-key"
                class="h-5 w-5 text-slate-400"
              />
              <input
                v-model="authForm.password"
                class="w-full bg-transparent outline-none"
                type="password"
                autocomplete="current-password"
                required
                minlength="6"
              />
            </div>
          </label>

          <button
            class="btn btn-primary h-11 w-full rounded-md"
            :disabled="isSubmitting"
          >
            <span
              v-if="isSubmitting"
              class="loading loading-spinner loading-sm"
            ></span>
            {{ userStore.authMode === "login" ? "登录" : "注册" }}
          </button>
        </form>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
    >
      <button @click="userStore.closeAuth">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";

import { useUserStore } from "~/store/user";

const userStore = useUserStore();
const authDialog = ref<HTMLDialogElement>();
const isSubmitting = ref(false);
const authForm = reactive({
  username: "",
  phone: "",
  password: "",
});

watch(
  () => userStore.isAuthModalOpen,
  (isOpen) => {
    if (isOpen) {
      authDialog.value?.showModal();
    } else {
      authDialog.value?.close();
      authForm.password = "";
    }
  },
);

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    if (userStore.authMode === "login") {
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
  } finally {
    isSubmitting.value = false;
  }
}
</script>
