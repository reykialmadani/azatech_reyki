"use client";

import type { ReactNode } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { OrderFormValues } from "@/lib/schemas/order";
import type { Product } from "@/types/product";

interface OrderSummaryCardProps {
  products: Record<number, Product>;
  isSubmitting: boolean;
  onClear: () => void;
  children: ReactNode; // daftar <OrderItemRow />
}

export function OrderSummaryCard({ products, isSubmitting, onClear, children }: OrderSummaryCardProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<OrderFormValues>();
  const items = useWatch({ control, name: "items" });

  // Pratinjau saja untuk kenyamanan kasir; angka final dihitung server.
  const totalQty = items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0), 0);
  const subtotal = items.reduce((sum, item) => {
    const price = Number(products[item.product_id]?.price ?? 0);
    const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
    return sum + price * qty;
  }, 0);
  const itemsError = errors.items?.message ?? errors.items?.root?.message;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white lg:sticky lg:top-20">
      <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-zinc-900">Rincian Pesanan</h2>
          <p className="text-xs text-zinc-500 tabular-nums">
            {items.length} produk · {totalQty} item
          </p>
        </div>
        {items.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="text-zinc-500" onClick={onClear}>
            Kosongkan
          </Button>
        )}
      </header>

      <div className="px-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ShoppingBag className="size-6 text-zinc-300" strokeWidth={1.5} />
            <p className="text-sm text-zinc-500">Belum ada produk di pesanan.</p>
            {itemsError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {itemsError}
              </p>
            )}
          </div>
        ) : (
          <ul className="max-h-[50vh] overflow-y-auto lg:max-h-[calc(100vh-24rem)]">{children}</ul>
        )}
      </div>

      <dl className="space-y-2 border-t border-zinc-200 px-5 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="micro-label">Sub-total</dt>
          <dd className="text-zinc-900 tabular-nums">{formatRupiah(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="micro-label">Pajak / Lainnya</dt>
          <dd className="text-zinc-500 tabular-nums">{formatRupiah(0)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-dashed border-zinc-200 pt-3">
          <dt className="micro-label text-zinc-900">Total Transaksi</dt>
          <dd className="text-xl font-semibold tracking-tight text-zinc-900 tabular-nums">
            {formatRupiah(subtotal)}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 px-5 pb-5">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-black text-sm font-semibold tracking-wide text-white uppercase hover:bg-zinc-800"
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Memproses…" : "Proses Transaksi"}
        </Button>
        <p className="text-center text-[11px] text-zinc-500">
          Harga & total final dihitung oleh server saat transaksi diproses.
        </p>
      </div>
    </section>
  );
}
