import type { User } from "~/types";
import { getHttp } from "./http";

export interface AuthResponse {
  token: string;
  user: User;
}

export function login(data: { phone: string; password: string }) {
  const http = getHttp();
  return http<AuthResponse>("/auth/login", {
    method: "post",
    body: data,
  });
}

export function register(data: { username: string; phone: string; password: string }) {
  const http = getHttp();
  return http<AuthResponse>("/auth/register", {
    method: "post",
    body: data,
  });
}
