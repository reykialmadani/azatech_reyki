// Router mini untuk mock API: mencocokkan method + path lalu membentuk Response
// dengan envelope yang sama persis seperti backend.
import type { ApiFieldErrors } from "@/types/api";

export const MOCK_TOKEN = "mock-access-token";

export interface MockContext {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
}

export type MockHandler = (ctx: MockContext) => Response;

export interface MockRoute {
  method: string;
  pattern: string; // contoh: "/products/:id"
  handler: MockHandler;
  public?: boolean;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const ok = <T>(data: T, status = 200, message = "OK") =>
  json(status, { success: true, message, data });

export const noContent = () => new Response(null, { status: 204 });

export const fail = (status: number, message: string, errors?: ApiFieldErrors) =>
  json(status, { success: false, message, ...(errors ? { errors } : {}) });

export function paginate<T>(rows: T[], query: URLSearchParams) {
  const page = Math.max(1, Number(query.get("page") ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(query.get("per_page") ?? 10)));
  const total = rows.length;
  return json(200, {
    success: true,
    message: "OK",
    data: rows.slice((page - 1) * perPage, page * perPage),
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
    },
  });
}

function match(pattern: string, path: string) {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const seg = a[i]!;
    if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(b[i]!);
    else if (seg !== b[i]) return null;
  }
  return params;
}

export function createMockFetch(routes: MockRoute[], latencyMs = 350) {
  return async (path: string, init: RequestInit): Promise<Response> => {
    await new Promise((r) => setTimeout(r, latencyMs));

    const url = new URL(path, "http://mock.local");
    const method = (init.method ?? "GET").toUpperCase();
    const auth = new Headers(init.headers).get("Authorization");

    for (const route of routes) {
      if (route.method !== method) continue;
      const params = match(route.pattern, url.pathname);
      if (!params) continue;

      if (!route.public && auth !== `Bearer ${MOCK_TOKEN}`) {
        return fail(401, "Sesi tidak valid atau telah berakhir");
      }
      const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
      return route.handler({ params, query: url.searchParams, body });
    }
    return fail(404, `Endpoint ${method} ${url.pathname} tidak ditemukan`);
  };
}
