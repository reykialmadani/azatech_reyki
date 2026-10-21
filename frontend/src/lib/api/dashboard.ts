import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

export const getDashboardSummary = () =>
  apiClient<ApiResponse<DashboardSummary>>("/dashboard/summary");
