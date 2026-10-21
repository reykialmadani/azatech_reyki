import { MOCK_CREDENTIALS, mockUser } from "./db";
import { MOCK_TOKEN, fail, noContent, ok, type MockRoute } from "./router";
import type { LoginPayload, LoginResult } from "@/types/auth";

const MOCK_REFRESH_TOKEN = "mock-refresh-token";

const session = (): LoginResult => ({
  access_token: MOCK_TOKEN,
  refresh_token: MOCK_REFRESH_TOKEN,
  token_type: "Bearer",
  expires_in: 900,
  user: mockUser,
});

export const authRoutes: MockRoute[] = [
  {
    method: "POST",
    pattern: "/auth/login",
    public: true,
    handler: ({ body }) => {
      const { email, password } = body as LoginPayload;
      if (email !== MOCK_CREDENTIALS.email || password !== MOCK_CREDENTIALS.password) {
        return fail(401, "Email atau password salah");
      }
      return ok(session());
    },
  },
  {
    method: "POST",
    pattern: "/auth/refresh",
    public: true,
    handler: ({ body }) => {
      const { refresh_token } = (body ?? {}) as { refresh_token?: string };
      return refresh_token === MOCK_REFRESH_TOKEN
        ? ok(session())
        : fail(401, "Sesi tidak valid atau telah berakhir");
    },
  },
  { method: "GET", pattern: "/auth/me", handler: () => ok(mockUser) },
  { method: "POST", pattern: "/auth/logout", handler: () => noContent() },
];
