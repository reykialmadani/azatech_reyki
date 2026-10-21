import { z } from "zod";
import type { CreateOrderPayload } from "@/types/order";

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

// Hanya id & quantity yang dikirim — harga dan total dihitung di server.
export const toOrderPayload = (values: OrderFormValues): CreateOrderPayload => ({
  customer_id: values.customer_id,
  items: values.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
});
