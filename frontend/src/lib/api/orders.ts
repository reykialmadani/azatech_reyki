import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { CreateOrderPayload, Order, OrderDetail, OrderListParams } from "@/types/order";

export const getOrders = (params: OrderListParams) =>
  apiClient<PaginatedResponse<Order>>("/orders", { query: { ...params } });

export const getOrder = (id: number) =>
  apiClient<ApiResponse<OrderDetail>>(`/orders/${id}`);

export const createOrder = (payload: CreateOrderPayload) =>
  apiClient<ApiResponse<OrderDetail>>("/orders", { method: "POST", body: payload });
