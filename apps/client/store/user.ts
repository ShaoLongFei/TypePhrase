import { defineStore } from "pinia";
import { ref } from "vue";

import type { User } from "~/types";
import { fetchCurrentUser, fetchLogin, fetchLogout, fetchRegister } from "~/api/auth";

export const useUserStore = defineStore("user", () => {
  const user = ref<User>();

  function initUser(val: User) {
    user.value = val;
  }

  async function register(data: { username: string; phone: string; password: string }) {
    user.value = await fetchRegister(data);
    return user.value;
  }

  async function login(data: { phone: string; password: string }) {
    user.value = await fetchLogin(data);
    return user.value;
  }

  async function loadCurrentUser() {
    try {
      user.value = await fetchCurrentUser();
    } catch {
      user.value = undefined;
    }
    return user.value;
  }

  async function logout() {
    await fetchLogout();
    user.value = undefined;
  }

  return {
    user,
    initUser,
    register,
    login,
    loadCurrentUser,
    logout,
  };
});
