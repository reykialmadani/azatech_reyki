import { z } from "zod";
import type { Product, ProductPayload } from "@/types/product";

const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

export const productSchema = z.object({
  product_code: z
    .string()
    .trim()
    .min(1, "Kode produk wajib diisi")
    .max(20, "Maksimal 20 karakter")
    .regex(/^[A-Za-z0-9-]+$/, "Hanya huruf, angka, dan tanda hubung"),
  product_name: z
    .string()
    .trim()
    .min(1, "Nama produk wajib diisi")
    .max(150, "Maksimal 150 karakter"),
  // Opsional: string kosong berarti tanpa gambar.
  image_url: z
    .string()
    .trim()
    .max(500, "URL maksimal 500 karakter")
    .refine((v) => v === "" || isHttpUrl(v), "URL gambar harus diawali http:// atau https://"),
  price: z
    .number({ error: "Harga wajib diisi" })
    .positive("Harga harus lebih dari 0")
    .max(9_999_999_999, "Harga terlalu besar"),
  stock: z
    .number({ error: "Stok wajib diisi" })
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const productFormDefaults = (product?: Product): ProductFormValues => ({
  product_code: product?.product_code ?? "",
  product_name: product?.product_name ?? "",
  image_url: product?.image_url ?? "",
  price: product ? Number(product.price) : Number.NaN,
  stock: product?.stock ?? 0,
});

export const toProductPayload = (values: ProductFormValues): ProductPayload => ({
  product_code: values.product_code.toUpperCase(),
  product_name: values.product_name,
  image_url: values.image_url || null,
  price: values.price,
  stock: values.stock,
});
