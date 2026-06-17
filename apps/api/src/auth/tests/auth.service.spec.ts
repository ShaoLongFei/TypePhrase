import { Test, TestingModule } from "@nestjs/testing";
import { jwtVerify } from "jose";

import { DB } from "../../global/providers/db.provider";
import { AuthService } from "../auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let dbMock: ReturnType<typeof createDbMock>;

  beforeEach(async () => {
    dbMock = createDbMock();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: DB, useValue: dbMock }],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it("registers a local user and returns a signed token", async () => {
    dbMock.query.users.findFirst.mockResolvedValueOnce(undefined);
    dbMock.returning.mockResolvedValueOnce([
      {
        id: "user_1",
        username: "typefan",
        phone: "15512345678",
        passwordHash: "hashed-password",
        avatar: "",
      },
    ]);

    const result = await authService.register({
      username: "typefan",
      phone: "15512345678",
      password: "secret123",
    });

    expect(result.user).toMatchObject({
      id: "user_1",
      username: "typefan",
      phone: "15512345678",
    });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(dbMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "typefan",
        phone: "15512345678",
        passwordHash: expect.not.stringMatching("secret123"),
      }),
    );

    const { payload } = await jwtVerify(result.token, getJwtSecret());
    expect(payload.sub).toBe(result.user.id);
  });

  it("logs in an existing local user", async () => {
    const registered = await authService.register({
      username: "typefan",
      phone: "15512345678",
      password: "secret123",
    });

    dbMock.query.users.findFirst.mockResolvedValueOnce({
      ...registered.user,
      passwordHash: dbMock.lastInsertedUser.passwordHash,
    });

    const result = await authService.login({
      phone: "15512345678",
      password: "secret123",
    });

    expect(result.user).toMatchObject({
      username: "typefan",
      phone: "15512345678",
    });
    await expect(jwtVerify(result.token, getJwtSecret())).resolves.toMatchObject({
      payload: {
        sub: result.user.id,
      },
    });
  });

  it("rejects duplicate phone registration", async () => {
    dbMock.query.users.findFirst.mockResolvedValueOnce({
      id: "user_1",
      phone: "15512345678",
    });

    await expect(
      authService.register({
        username: "another",
        phone: "15512345678",
        password: "secret123",
      }),
    ).rejects.toThrow("手机号已注册");
  });

  it("rejects invalid login credentials", async () => {
    const registered = await authService.register({
      username: "typefan",
      phone: "15512345678",
      password: "secret123",
    });

    dbMock.query.users.findFirst.mockResolvedValueOnce({
      ...registered.user,
      passwordHash: dbMock.lastInsertedUser.passwordHash,
    });

    await expect(
      authService.login({
        phone: "15512345678",
        password: "bad-password",
      }),
    ).rejects.toThrow("手机号或密码错误");
  });
});

function createDbMock() {
  const state = {
    lastInsertedUser: undefined,
  };
  const returning = jest.fn();
  const values = jest.fn((user) => {
    state.lastInsertedUser = user;
    return { returning };
  });
  const insert = jest.fn(() => ({ values }));

  returning.mockImplementation(async () => [
    {
      id: "user_1",
      username: state.lastInsertedUser.username,
      phone: state.lastInsertedUser.phone,
      passwordHash: state.lastInsertedUser.passwordHash,
      avatar: "",
    },
  ]);

  return {
    insert,
    values,
    returning,
    get lastInsertedUser() {
      return state.lastInsertedUser;
    },
    query: {
      users: {
        findFirst: jest.fn().mockResolvedValue(undefined),
      },
    },
  };
}

function getJwtSecret() {
  return new TextEncoder().encode(process.env.SECRET || "typephrase-dev-secret");
}
