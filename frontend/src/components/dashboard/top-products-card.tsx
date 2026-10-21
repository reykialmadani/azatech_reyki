import { TrendingUp } from "lucide-react";
import { ProductThumbnail } from "@/components/products/product-thumbnail";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRupiah } from "@/lib/format";
import type { TopProduct } from "@/types/dashboard";

export function TopProductsCard({ products }: { products: TopProduct[] }) {
  return (
    <section className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-lg font-medium tracking-tight text-zinc-900">5 Produk Terlaris</h2>
        <p className="text-sm text-zinc-500">Berdasarkan jumlah unit terjual.</p>
      </header>

      {products.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Belum ada penjualan" description="Produk terlaris akan muncul setelah ada transaksi." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="micro-label w-12 px-5 py-2.5 text-left">#</th>
                <th className="micro-label px-2 py-2.5 text-left">Produk</th>
                <th className="micro-label px-4 py-2.5 text-right">Terjual</th>
                <th className="micro-label px-5 py-2.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr key={product.product_id} className="h-14 border-t border-zinc-100">
                  <td className="px-5">
                    <span
                      className={
                        i === 0
                          ? "flex size-6 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white"
                          : "flex size-6 items-center justify-center rounded-full border border-zinc-200 text-[11px] font-semibold text-zinc-700"
                      }
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-2">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail src={product.image_url} alt={product.product_name} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">{product.product_name}</p>
                        <p className="font-mono text-xs text-zinc-500">{product.product_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 text-right whitespace-nowrap text-zinc-700 tabular-nums">
                    {product.total_qty} unit
                  </td>
                  <td className="px-5 text-right whitespace-nowrap font-medium text-zinc-900 tabular-nums">
                    {formatRupiah(product.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
