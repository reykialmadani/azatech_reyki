import type { DashboardSummary, DailySales, TopProduct } from "@/types/dashboard";
import { LOW_STOCK_THRESHOLD, type Product } from "@/types/product";
import { orders, products } from "./db";
import { ok, type MockRoute } from "./router";

const localDate = (d: Date) => d.toLocaleDateString("sv-SE"); // yyyy-MM-dd

function buildSummary(): DashboardSummary {
  const active = products.filter((p) => p.deleted_at === null);

  // Agregasi terlaris dari order_items (produk yang diarsipkan tetap dihitung).
  const sold = new Map<number, TopProduct>();
  for (const order of orders) {
    for (const item of order.items) {
      const row = sold.get(item.product_id) ?? {
        product_id: item.product_id,
        product_code: item.product.product_code,
        product_name: item.product.product_name,
        image_url: item.product.image_url,
        total_qty: 0,
        total_amount: "0",
      };
      row.total_qty += item.quantity;
      row.total_amount = (Number(row.total_amount) + Number(item.subtotal)).toFixed(2);
      sold.set(item.product_id, row);
    }
  }

  const days = new Map<string, DailySales>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.set(localDate(d), { date: localDate(d), total_amount: "0.00", transactions: 0 });
  }
  for (const order of orders) {
    const day = days.get(localDate(new Date(order.order_date)));
    if (!day) continue;
    day.total_amount = (Number(day.total_amount) + Number(order.total_amount)).toFixed(2);
    day.transactions += 1;
  }

  const lowStock = active
    .filter((p) => p.stock < LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .map((row): Product => {
      const product: Partial<typeof row> = { ...row };
      delete product.deleted_at;
      return product as Product;
    });

  return {
    total_sales: orders.reduce((sum, o) => sum + Number(o.total_amount), 0).toFixed(2),
    total_transactions: orders.length,
    active_products: active.length,
    low_stock_count: lowStock.length,
    top_products: [...sold.values()].sort((a, b) => b.total_qty - a.total_qty).slice(0, 5),
    low_stock_products: lowStock,
    daily_sales: [...days.values()],
  };
}

export const dashboardRoutes: MockRoute[] = [
  { method: "GET", pattern: "/dashboard/summary", handler: () => ok(buildSummary()) },
];
