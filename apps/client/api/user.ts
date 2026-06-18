import type { User } from "~/types";
import { getHttp } from "./http";

export interface SetupUserApiResponse {
  avatar: string;
  username: string;
}

export interface UserApiResponse {
  id: string;
  username: string;
  phone: string;
  avatar: string;
}

export async function fetchSetupNewUser(data: { username: string; avatar: string }) {
  const http = getHttp();
  return await http<SetupUserApiResponse>("/user/setup", {
    method: "post",
    body: data,
  });
}

export async function fetchCurrentUser() {
  const http = getHttp();
  return (await http<UserApiResponse>("/user", { method: "get" })) as User;
}
