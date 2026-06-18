import { DbType } from "src/global/providers/db.provider";

import { users } from "@earthworm/schema";
import { UserEntity } from "../../src/user/user.decorators";

export function createUser(): UserEntity {
  return {
    userId: "123456",
  };
}

export const getTestUserId = () => "123456";

export async function createLocalUser(db: DbType, username: string) {
  const [data] = await db
    .insert(users)
    .values({
      username,
      phone: `${Date.now()}`.slice(0, 11),
      passwordHash: "test-password-hash",
      avatar: "",
    })
    .returning();

  return { userId: data.id, username };
}
