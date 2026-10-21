"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { formatRupiah } from "@/lib/format";
import type { OrderFormValues } from "@/lib/schemas/order";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface OrderItemRowProps {
  index: number;
  product: Product | undefined; // snapshot untuk tampilan; bisa hilang jika data belum dimuat
  onRemove: () => void;
}

export function OrderItemRow({ index, product, onRemove }: OrderItemRowProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors, isSubmitted },
  } = useFormContext<OrderFormValues>();

  const quantity = useWatch({ control, name: `items.${index}.quantity` });
  const qty = Number.isFinite(quantity) ? quantity : 0;
  const unitPrice = Number(product?.price ?? 0);

  // Error per baris bisa datang dari Zod maupun dari server (mis. "items.0.quantity").
  const rowErrors = errors.items?.[index];
  const message = rowErrors?.quantity?.message ?? rowErrors?.product_id?.message;
  const inputId = `items-${index}-quantity`;

  // Batas atas jumlah = stok tersedia (jika snapshot produk sudah ada).
  const maxQty = product ? Math.max(1, product.stock) : undefined;
  const atMax = maxQty !== undefined && qty >= maxQty;

  const setQuantity = (next: number) =>
    setValue(`items.${index}.quantity`, Math.min(maxQty ?? Infinity, Math.max(1, next)), {
      shouldDirty: true,
      shouldValidate: isSubmitted, // juga menghapus error server setelah diperbaiki
    });

  return (
    <li
      className={cn(
        "flex gap-3 border-b border-zinc-100 py-4 last:border-b-0",
        message && "-mx-3 rounded-md border border-red-200 bg-red-50/60 px-3 last:border-b",
      )}
    >
      <ProductThumbnail src={product?.image_url} alt={product?.product_name ?? "Produk"} className="size-11" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">
              {product?.product_name ?? `Produk #${index + 1}`}
            </p>
            <p className="text-xs text-zinc-500">
              <span className="font-mono">{product?.product_code}</span>
              {product && <span className="tabular-nums"> · Stok tersedia {product.stock}</span>}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Hapus ${product?.product_name ?? "item"} dari pesanan`}
            className="text-zinc-400 hover:bg-red-50 hover:text-red-600"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Kurangi jumlah"
              className="rounded-r-none rounded-l-md"
              disabled={qty <= 1}
              onClick={() => setQuantity(qty - 1)}
            >
              <Minus />
            </Button>
            <input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={1}
              max={maxQty}
              step={1}
              aria-label={`Jumlah ${product?.product_name ?? ""}`}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? `${inputId}-error` : undefined}
              className={cn(
                "h-7 w-12 border-y border-zinc-200 bg-white text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                message && "border-red-600 text-red-700",
              )}
              {...register(`items.${index}.quantity`, {
                valueAsNumber: true,
                // Ketikan manual yang melebihi stok langsung dikembalikan ke batas stok.
                onChange: (event) => {
                  const typed = event.target.valueAsNumber;
                  if (maxQty !== undefined && Number.isFinite(typed) && typed > maxQty) {
                    setQuantity(maxQty);
                  }
                },
              })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Tambah jumlah"
              className="rounded-l-none rounded-r-md"
              disabled={atMax}
              title={atMax ? "Jumlah sudah mencapai stok tersedia" : undefined}
              onClick={() => setQuantity(qty + 1)}
            >
              <Plus />
            </Button>
          </div>

          <p className="text-xs text-zinc-500 tabular-nums">
            {formatRupiah(unitPrice)} × {qty} ={" "}
            <span className="text-sm font-semibold text-zinc-900">{formatRupiah(unitPrice * qty)}</span>
          </p>
        </div>

        {!message && atMax && (
          <p className="text-xs text-amber-600">Jumlah sudah mencapai batas stok tersedia.</p>
        )}

        {message && (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-red-600">
            {message}
          </p>
        )}
      </div>
    </li>
  );
}
