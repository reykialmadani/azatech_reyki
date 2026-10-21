import { clearToken, getRefreshToken, getToken, setToken } from "@/lib/auth/token";
import type { ApiErrorBody, ApiFieldErrors, ApiResponse } from "@/types/api";
import type { LoginResult } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
// Mode mock sementara selama backend belum siap (lihat lib/api/mock).
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: ApiFieldErrors;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? "Terjadi kesalahan pada server");
    this.name = "ApiError";
    this.status = status;
    this.errors = body.errors;
  }
}

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Query;
}

function buildPath(endpoint: string, query?: Query) {
  if (!query) return endpoint;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${endpoint}?${qs}` : endpoint;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  if (USE_MOCK) {
    const { mockFetch } = await import("./mock");
    return mockFetch(path, init);
  }
  return fetch(`${API_URL}${path}`, init);
}

const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

// Endpoint yang 401-nya tidak boleh memicu refresh (mencegah loop).
const NO_REFRESH_ENDPOINTS = ["/auth/login", "/auth/refresh", "/auth/logout"];

let refreshing: Promise<boolean> | null = null;

/**
 * Tukar refresh token dengan pasangan token baru. Beberapa request yang 401
 * bersamaan berbagi satu promise, karena refresh token hanya sah dipakai sekali (rotasi).
 */
function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await send("/auth/refresh", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return false;
      const { data } = (await res.json()) as ApiResponse<LoginResult>;
      setToken(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function apiClient<T>(
  endpoint: string,
  { body, query, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const request = async (token: string | null) => {
    try {
      return await send(buildPath(endpoint, query), {
        ...init,
        headers: {
          ...JSON_HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, {
        message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      });
    }
  };

  const token = getToken();
  let response = await request(token);

  // Access token kedaluwarsa: coba refresh sekali, lalu ulangi request.
  const canRefresh = !NO_REFRESH_ENDPOINTS.includes(endpoint);
  if (response.status === 401 && token && canRefresh && (await refreshSession())) {
    response = await request(getToken());
  }

  // Refresh gagal / sesi di-revoke: bersihkan sesi lalu hard redirect.
  // Login sendiri juga bisa 401 (kredensial salah) — biarkan form yang menangani.
  if (response.status === 401 && token && typeof window !== "undefined") {
    clearToken();
    // Hard redirect disengaja: mereset seluruh state & cache query di memori.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login?expired=true";
  }

  if (response.status === 204) return undefined as T;

  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, result as Partial<ApiErrorBody>);
  }
  return result as T;
}

export const isApiError = (err: unknown): err is ApiError =>
  err instanceof ApiError;
