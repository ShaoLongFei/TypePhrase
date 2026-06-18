import { ConflictException, UnauthorizedException } from "@nestjs/common";

import { AuthService } from "../auth.service";

describe("AuthService", () => {
  it("registers a user with a hashed password", async () => {
    const db = createDbMock();
    const authService = new AuthService(db as any);

    db.query.users.findFirst.mockResolvedValue(undefined);
    db.insertReturning.mockReturnValue({
      id: "user-1",
      username: "tester",
      phone: "15512345678",
      passwordHash: "hashed",
      avatar: "",
    });

    const user = await authService.register({
      username: "tester",
      phone: "15512345678",
      password: "password123",
    });

    expect(user).toEqual({
      id: "user-1",
      username: "tester",
      phone: "15512345678",
      avatar: "",
    });
    expect(db.insertValues.passwordHash).not.toBe("password123");
  });

  it("rejects duplicate phones", async () => {
    const db = createDbMock();
    const authService = new AuthService(db as any);

    db.query.users.findFirst.mockResolvedValue({ id: "existing-user" });

    await expect(
      authService.register({
        username: "tester",
        phone: "15512345678",
        password: "password123",
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("creates a session when login succeeds", async () => {
    const db = createDbMock();
    const authService = new AuthService(db as any);
    const passwordHash = await AuthService.hashPassword("password123");

    db.query.users.findFirst.mockResolvedValue({
      id: "user-1",
      username: "tester",
      phone: "15512345678",
      passwordHash,
      avatar: "",
    });
    db.insertReturning.mockReturnValue({ id: "session-1", tokenHash: "hash" });

    const result = await authService.login({
      phone: "15512345678",
      password: "password123",
    });

    expect(result.user.id).toBe("user-1");
    expect(result.sessionToken).toEqual(expect.any(String));
    expect(db.insertValues.userId).toBe("user-1");
  });

  it("finds a user id by a valid session token", async () => {
    const db = createDbMock();
    const authService = new AuthService(db as any);
    const sessionToken = "session-token";

    db.query.sessions.findFirst.mockResolvedValue({ userId: "user-1" });

    const userId = await authService.findUserIdBySessionToken(sessionToken);

    expect(userId).toBe("user-1");
    expect(db.query.sessions.findFirst).toHaveBeenCalled();
  });

  it("rejects invalid login credentials", async () => {
    const db = createDbMock();
    const authService = new AuthService(db as any);

    db.query.users.findFirst.mockResolvedValue(undefined);

    await expect(
      authService.login({
        phone: "15512345678",
        password: "wrong-password",
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

function createDbMock() {
  const db: any = {
    insertValues: undefined,
    insertReturning: jest.fn(),
    query: {
      users: {
        findFirst: jest.fn(),
      },
      sessions: {
        findFirst: jest.fn(),
      },
    },
  };

  db.insert = jest.fn(() => ({
    values: (values: any) => {
      db.insertValues = values;
      return {
        returning: () => Promise.resolve([db.insertReturning()]),
      };
    },
  }));

  return db;
}
