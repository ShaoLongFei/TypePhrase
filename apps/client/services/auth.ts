import { navigateTo } from "nuxt/app";

const TOKEN_KEY = "typephrase_token";

export async function signIn(callback?: string) {
  callback && setSignInCallback(callback);
  return navigateTo("/auth/login");
}

export function signOut() {
  clearToken();
  return navigateTo("/");
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getToken() {
  if (!import.meta.client) return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token: string) {
  if (!import.meta.client) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (!import.meta.client) return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getSignInCallback() {
  let callback = sessionStorage.getItem("callback");
  if (callback) {
    sessionStorage.removeItem("callback");
    return callback;
  } else {
    return "/";
  }
}

function setSignInCallback(callback: string) {
  sessionStorage.setItem("callback", callback);
}
