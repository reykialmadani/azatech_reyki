import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Customer, CustomerListParams, CustomerPayload } from "@/types/customer";

export const getCustomers = (params: CustomerListParams) =>
  apiClient<PaginatedResponse<Customer>>("/customers", { query: { ...params } });

export const getCustomer = (id: string) =>
  apiClient<ApiResponse<Customer>>(`/customers/${id}`);

export const createCustomer = (payload: CustomerPayload) =>
  apiClient<ApiResponse<Customer>>("/customers", { method: "POST", body: payload });

export const updateCustomer = (id: string, payload: CustomerPayload) =>
  apiClient<ApiResponse<Customer>>(`/customers/${id}`, { method: "PUT", body: payload });

export const deleteCustomer = (id: string) =>
  apiClient<void>(`/customers/${id}`, { method: "DELETE" });
