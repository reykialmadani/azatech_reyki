"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, login, logout } from "@/lib/api/auth";
import { clearToken, getToken, setToken, subscribeToken } from "@/lib/auth/token";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * Token saat ini. `undefined` = belum diketahui (render server / sebelum hidrasi),
 * `null` = tidak login, string = login.
 */
export function useAuthToken() {
  return useSyncExternalStore<string | null | undefined>(
    subscribeToken,
    getToken,
    () => undefined,
  );
}

export function useMe() {
  const token = useAuthToken();
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => (await getMe()).data,
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: login,
    onSuccess: ({ data }) => {
      setToken(data.access_token);
      queryClient.setQueryData(authKeys.me, data.user);
      router.replace("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    // Revoke di server bersifat best-effort; sesi lokal tetap dihapus.
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => {
      clearToken();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
