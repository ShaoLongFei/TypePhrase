import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentUser, fetchLogin, fetchLogout, fetchRegister } from "~/api/auth";
import { useUserStore } from "../user";

vi.mock("~/api/auth");

function generateUserInfo() {
  return {
    id: "123",
    username: "JohnDoe",
    phone: "1234567890",
    avatar: "",
  };
}

describe("user", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("initializes user state", () => {
    const userStore = useUserStore();

    userStore.initUser(generateUserInfo() as any);

    expect(userStore.user).toMatchInlineSnapshot(
      `
      {
        "avatar": "",
        "id": "123",
        "phone": "1234567890",
        "username": "JohnDoe",
      }
    `,
    );
  });

  it("logs in with phone and password", async () => {
    const userStore = useUserStore();
    vi.mocked(fetchLogin).mockResolvedValue(generateUserInfo());
    userStore.openAuth("login");

    await userStore.login({ phone: "1234567890", password: "password123" });

    expect(fetchLogin).toHaveBeenCalledWith({ phone: "1234567890", password: "password123" });
    expect(userStore.user?.id).toBe("123");
    expect(userStore.isAuthModalOpen).toBe(false);
  });

  it("registers with username, phone and password", async () => {
    const userStore = useUserStore();
    vi.mocked(fetchRegister).mockResolvedValue(generateUserInfo());

    await userStore.register({
      username: "JohnDoe",
      phone: "1234567890",
      password: "password123",
    });

    expect(fetchRegister).toHaveBeenCalledWith({
      username: "JohnDoe",
      phone: "1234567890",
      password: "password123",
    });
    expect(userStore.user?.username).toBe("JohnDoe");
  });

  it("loads the current user when a session exists", async () => {
    const userStore = useUserStore();
    vi.mocked(fetchCurrentUser).mockResolvedValue(generateUserInfo());

    await userStore.loadCurrentUser();

    expect(userStore.user?.phone).toBe("1234567890");
  });

  it("clears user state after logout", async () => {
    const userStore = useUserStore();
    userStore.initUser(generateUserInfo() as any);
    vi.mocked(fetchLogout).mockResolvedValue({ success: true });

    await userStore.logout();

    expect(fetchLogout).toHaveBeenCalled();
    expect(userStore.user).toBeUndefined();
  });

  it("opens and closes the shared auth modal", () => {
    const userStore = useUserStore();

    userStore.openAuth("register");

    expect(userStore.isAuthModalOpen).toBe(true);
    expect(userStore.authMode).toBe("register");

    userStore.closeAuth();

    expect(userStore.isAuthModalOpen).toBe(false);
  });
});
