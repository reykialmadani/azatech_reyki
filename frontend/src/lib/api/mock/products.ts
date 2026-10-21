import type { ApiFieldErrors } from "@/types/api";
import type { Product, ProductPayload } from "@/types/product";
import { nowIso, products } from "./db";
import { fail, noContent, ok, paginate, type MockRoute } from "./router";

const active = () => products.filter((p) => p.deleted_at === null);
const findActive = (id: string) => active().find((p) => p.id === Number(id));
const strip = (row: (typeof products)[number]): Product => {
  const product: Partial<typeof row> = { ...row };
  delete product.deleted_at;
  return product as Product;
};

// Meniru validasi backend: 422 untuk input tidak valid.
function validate(body: Partial<ProductPayload>): ApiFieldErrors | null {
  const errors: ApiFieldErrors = {};
  if (!body.product_code?.trim()) errors.product_code = ["Kode produk wajib diisi"];
  if (!body.product_name?.trim()) errors.product_name = ["Nama produk wajib diisi"];
  if (typeof body.price !== "number" || body.price <= 0) errors.price = ["Harga harus lebih dari 0"];
  if (typeof body.stock !== "number" || body.stock < 0) errors.stock = ["Stok tidak boleh negatif"];
  return Object.keys(errors).length ? errors : null;
}

// Kode unik berlaku juga untuk produk yang sudah di-soft-delete (constraint DB).
const codeTaken = (code: string, exceptId?: number) =>
  products.some((p) => p.product_code === code.toUpperCase() && p.id !== exceptId);

export const productRoutes: MockRoute[] = [
  {
    method: "GET",
    pattern: "/products",
    handler: ({ query }) => {
      const search = (query.get("search") ?? "").toLowerCase();
      const [field = "product_name", dir = "asc"] = (query.get("sort") ?? "").split(":");

      const rows = active()
        .filter(
          (p) =>
            !search ||
            p.product_name.toLowerCase().includes(search) ||
            p.product_code.toLowerCase().includes(search),
        )
        .sort((a, b) => {
          const factor = dir === "desc" ? -1 : 1;
          if (field === "price") return (Number(a.price) - Number(b.price)) * factor;
          if (field === "stock") return (a.stock - b.stock) * factor;
          return a.product_name.localeCompare(b.product_name) * factor;
        })
        .map(strip);

      return paginate(rows, query);
    },
  },
  {
    method: "GET",
    pattern: "/products/:id",
    handler: ({ params }) => {
      const product = findActive(params.id!);
      return product ? ok(strip(product)) : fail(404, "Produk tidak ditemukan");
    },
  },
  {
    method: "POST",
    pattern: "/products",
    handler: ({ body }) => {
      const payload = body as ProductPayload;
      const errors = validate(payload);
      if (errors) return fail(422, "Data tidak valid", errors);
      if (codeTaken(payload.product_code)) {
        return fail(409, "Kode produk sudah digunakan", {
          product_code: [`Kode ${payload.product_code.toUpperCase()} sudah digunakan`],
        });
      }
      const now = nowIso();
      const product = {
        id: Math.max(0, ...products.map((p) => p.id)) + 1,
        product_code: payload.product_code.toUpperCase(),
        product_name: payload.product_name.trim(),
        image_url: payload.image_url,
        stock: payload.stock,
        price: payload.price.toFixed(2),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      products.push(product);
      return ok(strip(product), 201, "Produk berhasil dibuat");
    },
  },
  {
    method: "PUT",
    pattern: "/products/:id",
    handler: ({ params, body }) => {
      const product = findActive(params.id!);
      if (!product) return fail(404, "Produk tidak ditemukan");
      const payload = body as ProductPayload;
      const errors = validate(payload);
      if (errors) return fail(422, "Data tidak valid", errors);
      if (codeTaken(payload.product_code, product.id)) {
        return fail(409, "Kode produk sudah digunakan", {
          product_code: [`Kode ${payload.product_code.toUpperCase()} sudah digunakan`],
        });
      }
      Object.assign(product, {
        product_code: payload.product_code.toUpperCase(),
        product_name: payload.product_name.trim(),
        image_url: payload.image_url,
        stock: payload.stock,
        price: payload.price.toFixed(2),
        updated_at: nowIso(),
      });
      return ok(strip(product), 200, "Produk berhasil diperbarui");
    },
  },
  {
    method: "DELETE",
    pattern: "/products/:id",
    handler: ({ params }) => {
      const product = findActive(params.id!);
      if (!product) return fail(404, "Produk tidak ditemukan");
      product.deleted_at = nowIso();
      return noContent();
    },
  },
];
