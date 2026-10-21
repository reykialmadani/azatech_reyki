"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth";

// Token disimpan di localStorage sehingga proteksi route dilakukan di client.
export function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAuthToken();
  const router = useRouter();

  useEffect(() => {
    if (token === null) router.replace("/login");
  }, [token, router]);

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="micro-label">Memuat sesi…</span>
      </div>
    );
  }
  return children;
}
