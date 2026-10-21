import { beforeEach, describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api/client";
import { MOCK_TOKEN } from "@/lib/api/mock/router";
import { clearToken, getRefreshToken, getToken, setToken } from "@/lib/auth/token";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/auth";

const getMe = () => apiClient<ApiResponse<User>>("/auth/me");

describe("Silent refresh token", () => {
  beforeEach(() => clearToken());

  it("access token kedaluwarsa → refresh otomatis lalu request diulang", async () => {
    setToken("access-token-kedaluwarsa", "mock-refresh-token");

    const res = await getMe();

    expect(res.data.email).toBeTruthy();
    expect(getToken()).toBe(MOCK_TOKEN);
    expect(getRefreshToken()).toBe("mock-refresh-token");
  });

  it("refresh token tidak valid → sesi dibersihkan dan error 401 diteruskan", async () => {
    setToken("access-token-kedaluwarsa", "refresh-token-dicabut");

    await expect(getMe()).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
