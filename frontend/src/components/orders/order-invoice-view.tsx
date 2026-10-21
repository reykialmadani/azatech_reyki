import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import type { OrderDetail } from "@/types/order";

// Faktur minimalis; juga menjadi tampilan cetak (lihat @media print di globals.css).
export function OrderInvoiceView({ order }: { order: OrderDetail }) {
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="invoice rounded-lg border border-zinc-200 bg-white print:rounded-none print:border-0">
      <header className="flex flex-col gap-6 border-b border-zinc-200 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-[0.2em] text-black">AZATECH</span>
            <span className="rounded-sm bg-black px-1 py-px text-[9px] font-semibold tracking-wider text-white print:border print:border-black">
              STORE
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Sistem Order Management &amp; Katalog</p>
        </div>
        <div className="space-y-1 sm:text-right">
          <p className="micro-label">Faktur Penjualan</p>
          <p className="font-mono text-lg font-semibold text-zinc-900">{order.order_number}</p>
          <p className="text-sm text-zinc-500 tabular-nums">{formatTanggalWaktu(order.order_date)}</p>
          <span className="mt-1 inline-flex h-6 items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 text-xs font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden />
            Selesai
          </span>
        </div>
      </header>

      <section className="grid gap-6 border-b border-zinc-200 p-6 sm:grid-cols-2 sm:p-8">
        <div className="space-y-1.5">
          <p className="micro-label">Ditagihkan Kepada</p>
          <p className="font-medium text-zinc-900">{order.customer.customer_name}</p>
          <p className="font-mono text-sm text-zinc-700">{order.customer.phone ?? "-"}</p>
          <p className="text-sm text-zinc-700">{order.customer.customer_address}</p>
        </div>
        <div className="space-y-1.5 sm:text-right">
          <p className="micro-label">Kasir / Admin</p>
          <p className="text-sm text-zinc-900">{order.user.name}</p>
        </div>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 print:bg-transparent">
              <th className="micro-label px-6 py-3 text-left sm:px-8">Produk</th>
              <th className="micro-label px-4 py-3 text-right">Harga Satuan</th>
              <th className="micro-label px-4 py-3 text-right">Qty</th>
              <th className="micro-label px-6 py-3 text-right sm:px-8">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-100">
                <td className="px-6 py-3 sm:px-8">
                  <p className="font-medium text-zinc-900">{item.product.product_name}</p>
                  <p className="font-mono text-xs text-zinc-500">{item.product.product_code}</p>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-zinc-700 tabular-nums">
                  {formatRupiah(item.unit_price)}
                </td>
                <td className="px-4 py-3 text-right text-zinc-700 tabular-nums">{item.quantity}</td>
                <td className="px-6 py-3 text-right whitespace-nowrap font-medium text-zinc-900 tabular-nums sm:px-8">
                  {formatRupiah(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <p className="max-w-sm text-xs text-zinc-500">
          Harga satuan adalah harga produk pada saat transaksi dibuat dan tidak berubah meskipun harga katalog diperbarui.
        </p>
        <dl className="w-full space-y-2 text-sm sm:w-72">
          <div className="flex justify-between text-zinc-500">
            <dt>Jumlah item</dt>
            <dd className="tabular-nums">{totalQty}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t-2 border-black pt-3">
            <dt className="micro-label text-zinc-900">Grand Total</dt>
            <dd className="text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">
              {formatRupiah(order.total_amount)}
            </dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}
