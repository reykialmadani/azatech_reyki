import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Product, ProductListParams, ProductPayload } from "@/types/product";

export const getProducts = (params: ProductListParams) =>
  apiClient<PaginatedResponse<Product>>("/products", { query: { ...params } });

export const getProduct = (id: number) =>
  apiClient<ApiResponse<Product>>(`/products/${id}`);

export const createProduct = (payload: ProductPayload) =>
  apiClient<ApiResponse<Product>>("/products", { method: "POST", body: payload });

export const updateProduct = (id: number, payload: ProductPayload) =>
  apiClient<ApiResponse<Product>>(`/products/${id}`, { method: "PUT", body: payload });

export const deleteProduct = (id: number) =>
  apiClient<void>(`/products/${id}`, { method: "DELETE" });
