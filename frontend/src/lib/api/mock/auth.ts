import { MOCK_CREDENTIALS, mockUser } from "./db";
import { MOCK_TOKEN, fail, noContent, ok, type MockRoute } from "./router";
import type { LoginPayload } from "@/types/auth";

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
      return ok({ access_token: MOCK_TOKEN, user: mockUser });
    },
  },
  { method: "GET", pattern: "/auth/me", handler: () => ok(mockUser) },
  { method: "POST", pattern: "/auth/logout", handler: () => noContent() },
];
