import { z } from "zod";
import type { CreateOrderPayload } from "@/types/order";
import type { Product } from "@/types/product";

export const orderSchema = z.object({
  customer_id: z.string().min(1, "Pilih pelanggan terlebih dahulu"),
  items: z
    .array(
      z.object({
        product_id: z.number(),
        quantity: z
          .number({ error: "Jumlah wajib diisi" })
          .int("Jumlah harus bilangan bulat")
          .min(1, "Jumlah minimal 1"),
      }),
    )
    .min(1, "Tambahkan minimal satu produk ke pesanan"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

export interface StockIssue {
  index: number;
  message: string;
}

// Validasi akhir sebelum submit: jumlah tiap item tidak boleh melebihi stok yang diketahui.
// Server tetap memvalidasi ulang karena stok bisa berubah sejak produk dipilih.
export const findStockIssues = (
  items: OrderFormValues["items"],
  products: Record<number, Product>,
): StockIssue[] =>
  items.flatMap((item, index) => {
    const product = products[item.product_id];
    if (!product || item.quantity <= product.stock) return [];
    return [
      {
        index,
        message:
          product.stock <= 0
            ? `Stok ${product.product_name} habis`
            : `Stok ${product.product_name} tersisa ${product.stock}, diminta ${item.quantity}`,
      },
    ];
  });

// Hanya id & quantity yang dikirim — harga dan total dihitung di server.
export const toOrderPayload = (values: OrderFormValues): CreateOrderPayload => ({
  customer_id: values.customer_id,
  items: values.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
});
