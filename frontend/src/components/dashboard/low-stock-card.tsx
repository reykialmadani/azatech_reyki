"use client";

import { useState } from "react";
import { PackageCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDialog } from "@/components/products/product-dialog";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { StockBadge } from "@/components/products/stock-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Product } from "@/types/product";

export function LowStockCard({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  const restock = (product: Product) => {
    setSelected(product);
    setOpen(true);
  };

  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-zinc-900">Perhatian: Stok Menipis</h2>
          <p className="text-sm text-zinc-500">Produk dengan sisa stok di bawah 5 unit.</p>
        </div>
        {products.length > 0 && (
          <span className="inline-flex h-6 shrink-0 items-center rounded-md border border-red-200 bg-red-50 px-2 text-xs font-medium text-red-600 tabular-nums">
            {products.length} produk
          </span>
        )}
      </header>

      {products.length === 0 ? (
        <EmptyState icon={PackageCheck} title="Semua stok aman" description="Tidak ada produk dengan stok di bawah 5 unit." />
      ) : (
        <div className="max-h-[22rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50">
              <tr>
                <th className="micro-label px-5 py-2.5 text-left">Produk</th>
                <th className="micro-label px-4 py-2.5 text-left">Sisa Stok</th>
                <th className="micro-label px-5 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="h-14 border-t border-zinc-100">
                  <td className="px-5">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail src={product.image_url} alt={product.product_name} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{product.product_name}</p>
                        <p className="font-mono text-xs text-zinc-500">{product.product_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4">
                    <StockBadge stock={product.stock} />
                  </td>
                  <td className="px-5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      aria-label={`Restock ${product.product_name}`}
                      onClick={() => restock(product)}
                    >
                      <Plus />
                      Restock
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Restock = edit stok lewat dialog produk yang sama; dashboard ikut ter-invalidate. */}
      <ProductDialog open={open} onOpenChange={setOpen} product={selected} />
    </section>
  );
}
