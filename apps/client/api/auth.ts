import type { User } from "~/types";
import { getHttp } from "./http";

export interface RegisterPayload {
  username: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export type AuthUserApiResponse = User;

export async function fetchRegister(data: RegisterPayload) {
  const http = getHttp();
  return (await http<AuthUserApiResponse>("/auth/register", {
    method: "post",
    body: data,
  })) as User;
}

export async function fetchLogin(data: LoginPayload) {
  const http = getHttp();
  return (await http<AuthUserApiResponse>("/auth/login", {
    method: "post",
    body: data,
  })) as User;
}

export async function fetchCurrentUser() {
  const http = getHttp();
  return (await http<AuthUserApiResponse>("/auth/me", { method: "get" })) as User;
}

export async function fetchLogout() {
  const http = getHttp();
  return http<{ success: boolean }>("/auth/logout", { method: "post" });
}
