import type { ApiFieldErrors } from "@/types/api";
import type { CreateOrderPayload, Order, OrderDetail } from "@/types/order";
import { customers, mockUser, nextOrderNumber, nowIso, orders, products } from "./db";
import { fail, ok, paginate, type MockRoute } from "./router";

/**
 * Meniru prisma.$transaction di backend: semua item divalidasi dulu,
 * stok baru dipotong jika SEMUA lolos. Satu item gagal = seluruh order gagal.
 */
function createOrder(payload: CreateOrderPayload) {
  const errors: ApiFieldErrors = {};
  const customer = customers.find((c) => c.id === payload.customer_id && c.deleted_at === null);
  if (!customer) errors.customer_id = ["Pelanggan tidak ditemukan"];

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.items = ["Pesanan harus berisi minimal satu produk"];
    return fail(422, "Data tidak valid", errors);
  }

  // Validasi format dulu (422), baru ketersediaan stok (409).
  payload.items.forEach((item, i) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      errors[`items.${i}.quantity`] = ["Jumlah minimal 1"];
    }
  });
  if (Object.keys(errors).length) return fail(422, "Data tidak valid", errors);

  const lines = payload.items.map((item, i) => {
    const product = products.find((p) => p.id === item.product_id && p.deleted_at === null);
    if (!product) {
      errors[`items.${i}.product_id`] = ["Produk tidak ditemukan atau sudah diarsipkan"];
    } else if (product.stock < item.quantity) {
      errors[`items.${i}.quantity`] = [
        `Stok ${product.product_name} tersisa ${product.stock}, diminta ${item.quantity}`,
      ];
    }
    return { item, product };
  });
  if (Object.keys(errors).length) return fail(409, "Stok tidak mencukupi", errors);

  // --- Semua valid: "commit" transaksi ---
  const now = new Date();
  const orderId = Math.max(0, ...orders.map((o) => o.id)) + 1;
  let itemId = Math.max(0, ...orders.flatMap((o) => o.items.map((it) => it.id)));

  const items = lines.map(({ item, product }) => {
    const p = product!;
    p.stock -= item.quantity;
    p.updated_at = now.toISOString();
    const unitPrice = Number(p.price); // snapshot harga saat ini
    return {
      id: ++itemId,
      product_id: p.id,
      quantity: item.quantity,
      unit_price: unitPrice.toFixed(2),
      subtotal: (unitPrice * item.quantity).toFixed(2),
      product: {
        id: p.id,
        product_code: p.product_code,
        product_name: p.product_name,
        image_url: p.image_url,
      },
    };
  });

  const order: OrderDetail = {
    id: orderId,
    order_number: nextOrderNumber(now),
    customer_id: customer!.id,
    created_by: mockUser.id,
    order_date: now.toISOString(),
    total_amount: items.reduce((sum, it) => sum + Number(it.subtotal), 0).toFixed(2),
    created_at: nowIso(),
    updated_at: nowIso(),
    customer: {
      id: customer!.id,
      customer_name: customer!.customer_name,
      phone: customer!.phone,
      customer_address: customer!.customer_address,
    },
    user: { id: mockUser.id, name: mockUser.name },
    items_count: items.length,
    items,
  };
  orders.push(order);
  return ok(order, 201, "Pesanan berhasil dibuat");
}

const localDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const orderRoutes: MockRoute[] = [
  {
    method: "GET",
    pattern: "/orders",
    handler: ({ query }) => {
      const from = query.get("from"); // inklusif, yyyy-MM-dd
      const to = query.get("to"); // inklusif sampai akhir hari
      const customerId = query.get("customer_id");

      const rows = orders
        .filter((o) => {
          const day = localDate(o.order_date);
          return (!from || day >= from) && (!to || day <= to) && (!customerId || o.customer_id === customerId);
        })
        .sort((a, b) => b.order_date.localeCompare(a.order_date))
        .map((o): Order => {
          const summary: Partial<OrderDetail> = { ...o };
          delete summary.items; // list tidak menyertakan item
          return summary as Order;
        });
      return paginate(rows, query);
    },
  },
  {
    method: "POST",
    pattern: "/orders",
    handler: ({ body }) => createOrder(body as CreateOrderPayload),
  },
  {
    method: "GET",
    pattern: "/orders/:id",
    handler: ({ params }) => {
      const order = orders.find((o) => o.id === Number(params.id));
      return order ? ok(order) : fail(404, "Pesanan tidak ditemukan");
    },
  },
];
