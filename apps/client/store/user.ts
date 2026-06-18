import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type { User } from "~/types";
import { fetchCurrentUser, fetchLogin, fetchLogout, fetchRegister } from "~/api/auth";

export const useUserStore = defineStore("user", () => {
  const user = ref<User>();
  const isAuthReady = ref(false);
  const isLoadingCurrentUser = ref(false);
  const isAuthModalOpen = ref(false);
  const authMode = ref<"login" | "register">("login");
  const isAuthenticated = computed(() => Boolean(user.value));

  function initUser(val: User) {
    user.value = val;
  }

  async function register(data: { username: string; phone: string; password: string }) {
    user.value = await fetchRegister(data);
    closeAuth();
    return user.value;
  }

  async function login(data: { phone: string; password: string }) {
    user.value = await fetchLogin(data);
    closeAuth();
    return user.value;
  }

  async function loadCurrentUser() {
    if (isAuthReady.value) return user.value;
    if (isLoadingCurrentUser.value) return user.value;
    isLoadingCurrentUser.value = true;
    try {
      user.value = await fetchCurrentUser();
    } catch {
      user.value = undefined;
    } finally {
      isAuthReady.value = true;
      isLoadingCurrentUser.value = false;
    }
    return user.value;
  }

  async function logout() {
    await fetchLogout();
    user.value = undefined;
  }

  function openAuth(mode: "login" | "register" = "login") {
    authMode.value = mode;
    isAuthModalOpen.value = true;
  }

  function closeAuth() {
    isAuthModalOpen.value = false;
  }

  function setAuthMode(mode: "login" | "register") {
    authMode.value = mode;
  }

  return {
    user,
    isAuthReady,
    isLoadingCurrentUser,
    isAuthenticated,
    isAuthModalOpen,
    authMode,
    initUser,
    register,
    login,
    loadCurrentUser,
    logout,
    openAuth,
    closeAuth,
    setAuthMode,
  };
});
