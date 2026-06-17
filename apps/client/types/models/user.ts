import type { SetupUserApiResponse } from "~/api/user";
import { type UserApiResponse } from "~/api/user";

export interface SetupUser extends SetupUserApiResponse {}

export type User = UserApiResponse & {
  id: string;
  username: string;
  phone: string;
  avatar: string;
};
