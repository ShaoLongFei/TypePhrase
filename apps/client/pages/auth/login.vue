<template>
  <div class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-6">
    <form
      class="w-full space-y-5 rounded-lg bg-base-100 p-6 shadow-even-lg dark:bg-gray-900"
      @submit.prevent="handleLogin"
    >
      <div>
        <h2 class="text-2xl font-bold">登录 TypePhrase</h2>
        <p class="mt-1 text-sm text-gray-500">继续你的英语句子训练</p>
      </div>

      <label class="form-control">
        <div class="label">
          <span class="label-text">手机号</span>
        </div>
        <input
          v-model="phone"
          class="input input-bordered"
          autocomplete="tel"
          maxlength="20"
          type="tel"
        />
      </label>

      <label class="form-control">
        <div class="label">
          <span class="label-text">密码</span>
        </div>
        <input
          v-model="password"
          class="input input-bordered"
          autocomplete="current-password"
          maxlength="64"
          type="password"
        />
      </label>

      <button
        class="btn btn-primary w-full"
        type="submit"
        :disabled="isLoading"
      >
        登录
        <span
          v-if="isLoading"
          class="loading loading-spinner"
        ></span>
      </button>

      <p class="text-center text-sm text-gray-500">
        还没有账号？
        <NuxtLink
          class="text-purple-500 hover:text-purple-600"
          to="/auth/register"
        >
          注册
        </NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "nuxt/app";
import { ref } from "vue";
import { toast } from "vue-sonner";

import { login } from "~/api/auth";
import { getSignInCallback, setToken } from "~/services/auth";
import { useUserStore } from "~/store/user";

const phone = ref("");
const password = ref("");
const isLoading = ref(false);
const userStore = useUserStore();

async function handleLogin() {
  if (!phone.value || !password.value) {
    toast.error("请输入手机号和密码");
    return;
  }

  isLoading.value = true;
  try {
    const result = await login({
      phone: phone.value,
      password: password.value,
    });
    setToken(result.token);
    userStore.initUser(result.user);
    await navigateTo(getSignInCallback());
  } finally {
    isLoading.value = false;
  }
}
</script>
