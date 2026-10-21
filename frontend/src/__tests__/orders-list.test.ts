import { beforeAll, describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api/client";
import { orders } from "@/lib/api/mock/db";
import { MOCK_TOKEN } from "@/lib/api/mock/router";
import { setToken } from "@/lib/auth/token";
import type { PaginatedResponse } from "@/types/api";
import type { Order, OrderListParams } from "@/types/order";

const localDay = (d: Date) => d.toLocaleDateString("sv-SE"); // yyyy-MM-dd
const daysFromToday = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localDay(d);
};

const listOrders = (query: OrderListParams) =>
  apiClient<PaginatedResponse<Order>>("/orders", { query: { ...query } });

beforeAll(() => setToken(MOCK_TOKEN));

describe("Riwayat pesanan", () => {
  it("seed berisi 30 order dengan nomor INV unik dan total yang konsisten", () => {
    expect(orders).toHaveLength(30);
    expect(new Set(orders.map((o) => o.order_number)).size).toBe(30);
    for (const order of orders) {
      expect(order.order_number).toMatch(/^INV-\d{8}-\d{4}$/);
      const sum = order.items.reduce((total, item) => total + Number(item.subtotal), 0);
      expect(Number(order.total_amount)).toBe(sum);
    }
  });

  it("paginasi terbaru dulu tanpa menyertakan item", async () => {
    const res = await listOrders({ page: 1, per_page: 10 });
    expect(res.meta).toMatchObject({ page: 1, per_page: 10, total: 30, total_pages: 3 });
    expect(res.data[0]).not.toHaveProperty("items");
    expect(res.data[0]!.order_date >= res.data[9]!.order_date).toBe(true);
  });

  it("filter rentang tanggal (inklusif) dan pelanggan", async () => {
    const from = daysFromToday(-7);
    const to = daysFromToday(0);
    const byDate = await listOrders({ from, to, per_page: 100 });
    for (const order of byDate.data) {
      const day = localDay(new Date(order.order_date));
      expect(day >= from && day <= to).toBe(true);
    }

    const customerId = orders[0]!.customer_id;
    const byCustomer = await listOrders({ customer_id: customerId, per_page: 100 });
    expect(byCustomer.data).toHaveLength(orders.filter((o) => o.customer_id === customerId).length);
    expect(byCustomer.data.every((o) => o.customer_id === customerId)).toBe(true);
  });

  it("detail order yang tidak ada mengembalikan 404", async () => {
    await expect(apiClient("/orders/9999")).rejects.toMatchObject({ status: 404 });
  });
});
