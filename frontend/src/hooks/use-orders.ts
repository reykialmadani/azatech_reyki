"use client";

import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrder, getOrder, getOrders } from "@/lib/api/orders";
import { isApiError } from "@/lib/api/client";
import type { CreateOrderPayload, OrderListParams } from "@/types/order";
import { productKeys } from "./use-products";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: OrderListParams) => ["orders", "list", params] as const,
  detail: (id: number) => ["orders", "detail", id] as const,
};

export function useOrders(params: OrderListParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => (await getOrder(id)).data,
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: ({ data }) => {
      // Stok berkurang, riwayat & ringkasan penjualan bertambah.
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.setQueryData(orderKeys.detail(data.id), data);

      toast.success(`Pesanan ${data.order_number} berhasil dibuat`);
      router.push(`/orders/${data.id}`);
    },
    onError: (error) => {
      // Stok di database sudah berbeda dari yang ditampilkan: segarkan daftar produk.
      if (isApiError(error) && (error.status === 409 || error.status === 422)) {
        queryClient.invalidateQueries({ queryKey: productKeys.all });
      }
    },
  });
}
