import { authRoutes } from "./auth";
import { customerRoutes } from "./customers";
import { dashboardRoutes } from "./dashboard";
import { orderRoutes } from "./orders";
import { productRoutes } from "./products";
import { createMockFetch } from "./router";

export const mockFetch = createMockFetch([
  ...authRoutes,
  ...productRoutes,
  ...customerRoutes,
  ...orderRoutes,
  ...dashboardRoutes,
]);
