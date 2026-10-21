import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api";
import type { LoginPayload, LoginResult, User } from "@/types/auth";

export const login = (payload: LoginPayload) =>
  apiClient<ApiResponse<LoginResult>>("/auth/login", {
    method: "POST",
    body: payload,
  });

export const getMe = () => apiClient<ApiResponse<User>>("/auth/me");

export const logout = () => apiClient<void>("/auth/logout", { method: "POST" });
