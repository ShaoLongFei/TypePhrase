import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { navigateTo } from "nuxt/app";

import { clearToken, getSignInCallback, getToken, isAuthenticated, setToken, signIn } from "../auth";

function createStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

vi.stubGlobal("localStorage", createStorageMock());
vi.stubGlobal("sessionStorage", createStorageMock());

vi.mock("nuxt/app", () => ({
  navigateTo: vi.fn(),
}));

describe("auth", () => {
  let navigateToMock: Mock;

  beforeEach(() => {
    navigateToMock = navigateTo as unknown as Mock;
    localStorage.clear();
    sessionStorage.clear();
    navigateToMock.mockClear();
  });

  it("stores and clears the local auth token", () => {
    expect(isAuthenticated()).toBe(false);

    setToken("token-1");

    expect(getToken()).toBe("token-1");
    expect(isAuthenticated()).toBe(true);

    clearToken();

    expect(getToken()).toBe("");
    expect(isAuthenticated()).toBe(false);
  });

  it("should get signIn callback and consume callback", async () => {
    await signIn("/main/1");

    expect(navigateToMock).toHaveBeenCalledWith("/auth/login");
    expect(getSignInCallback()).toBe("/main/1");
    expect(getSignInCallback()).toBe("/");
  });

  it("should get default callback", async () => {
    await signIn();

    expect(getSignInCallback()).toBe("/");
  });
});
