"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "@/lib/api/customers";
import type { CustomerListParams, CustomerPayload } from "@/types/customer";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params: CustomerListParams) => ["customers", "list", params] as const,
};

export function useCustomers(params: CustomerListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: customerKeys.all });
}

export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (payload: CustomerPayload) => createCustomer(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerPayload }) =>
      updateCustomer(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteCustomer() {
  const invalidate = useInvalidateCustomers();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: invalidate,
  });
}
