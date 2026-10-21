import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeAll, describe, expect, it } from "vitest";
import { apiClient, isApiError } from "@/lib/api/client";
import { applyServerErrors } from "@/lib/api/form-errors";
import { products } from "@/lib/api/mock/db";
import { MOCK_TOKEN } from "@/lib/api/mock/router";
import { setToken } from "@/lib/auth/token";
import { orderSchema, toOrderPayload, type OrderFormValues } from "@/lib/schemas/order";
import type { ApiResponse } from "@/types/api";
import type { OrderDetail } from "@/types/order";

const CUSTOMER_ID = "c0a80121-7ac0-4e1c-9d5e-000000000001";
const stockOf = (id: number) => products.find((p) => p.id === id)!.stock;

const postOrder = (body: unknown) =>
  apiClient<ApiResponse<OrderDetail>>("/orders", { method: "POST", body });

beforeAll(() => setToken(MOCK_TOKEN));

describe("Transaksi penjualan (POS)", () => {
  it("menolak stok kurang secara atomik dan memetakan error ke baris item", async () => {
    // Produk 1 stok 10 (cukup), produk 2 stok 3 (diminta 5 → gagal).
    const values: OrderFormValues = {
      customer_id: CUSTOMER_ID,
      items: [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 5 },
      ],
    };
    const before = [stockOf(1), stockOf(2)];

    const error = await postOrder(toOrderPayload(values)).catch((e: unknown) => e);
    expect(isApiError(error) && error.status).toBe(409);
    // Satu item gagal = seluruh order gagal, tidak ada stok yang berkurang.
    expect([stockOf(1), stockOf(2)]).toEqual(before);

    const { result } = renderHook(() => useForm<OrderFormValues>({ defaultValues: values }));
    let mapped = false;
    act(() => {
      mapped = applyServerErrors(error, result.current.setError, ["customer_id", "items"]);
    });

    expect(mapped).toBe(true);
    expect(result.current.getFieldState("items.1.quantity").error?.message).toBe(
      "Stok Teh Botol Sosro 250ml tersisa 3, diminta 5",
    );
    expect(result.current.getFieldState("items.0.quantity").error).toBeUndefined();
  });

  it("hanya mengirim product_id & quantity; total dihitung dan stok dipotong server", async () => {
    const payload = toOrderPayload(
      orderSchema.parse({
        customer_id: CUSTOMER_ID,
        items: [
          { product_id: 1, quantity: 2 },
          { product_id: 3, quantity: 1 },
        ],
      }),
    );
    expect(Object.keys(payload.items[0]!)).toEqual(["product_id", "quantity"]);

    const before = stockOf(1);
    const { data } = await postOrder(payload);

    expect(data.total_amount).toBe("29000.00"); // 12.000 × 2 + 5.000 × 1
    expect(data.items[0]?.unit_price).toBe("12000.00"); // snapshot harga
    expect(data.order_number).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(stockOf(1)).toBe(before - 2);
  });

  it("validasi client menolak keranjang kosong dan pelanggan belum dipilih", () => {
    const result = orderSchema.safeParse({ customer_id: "", items: [] });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["customer_id", "items"]));
  });
});
