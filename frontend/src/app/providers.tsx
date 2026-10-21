"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { isApiError } from "@/lib/api/client";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Error 4xx (validasi, 404, 401) tidak akan sembuh dengan retry.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status >= 400 && error.status < 500) &&
          failureCount < 2,
      },
    },
  });
}

function getQueryClient() {
  // Server: client baru per render. Browser: satu client agar cache bertahan.
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      <Toaster theme="light" position="top-right" richColors={false} />
    </QueryClientProvider>
  );
}
