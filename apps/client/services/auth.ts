import { navigateTo } from "nuxt/app";

export async function signIn(callback?: string) {
  return navigateTo(callback || "/course-pack");
}

export function signOut() {
  clearToken();
  return navigateTo("/course-pack");
}

export function isAuthenticated() {
  return false;
}

export function getToken() {
  return "";
}

export function setToken(token: string) {
  void token;
}

export function clearToken() {}

export function getSignInCallback() {
  return "/course-pack";
}
