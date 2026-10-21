"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus, ReceiptText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeletonRows } from "@/components/shared/table-skeleton";
import { useOrders } from "@/hooks/use-orders";
import { errorMessage } from "@/lib/api/form-errors";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import type { Customer } from "@/types/customer";
import { CustomerCombobox } from "./customer-combobox";

const PER_PAGE = 10;
const COLUMNS = 6;

export function OrdersView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);

  // Rentang terbalik tidak dikirim ke server; tampilkan pesan saja.
  const invalidRange = Boolean(from && to && from > to);
  const hasFilter = Boolean(from || to || customer);

  const { data, isPending, isError, error, isPlaceholderData, refetch } = useOrders({
    page,
    per_page: PER_PAGE,
    from: invalidRange ? undefined : from || undefined,
    to: invalidRange ? undefined : to || undefined,
    customer_id: customer?.id,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;

  if (meta && !isPlaceholderData && page > meta.total_pages) {
    setPage(meta.total_pages);
  }

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setCustomer(null);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat Pesanan"
        description={
          meta ? (
            <>
              <span className="font-medium text-zinc-900 tabular-nums">{meta.total}</span>{" "}
              {hasFilter ? "pesanan sesuai filter" : "transaksi tercatat"}
            </>
          ) : (
            "Seluruh transaksi penjualan toko."
          )
        }
        actions={
          <Link
            href="/orders/new"
            className="flex h-9 items-center gap-1.5 rounded-md bg-black px-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
          >
            <Plus className="size-4" />
            Pesanan Baru
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 lg:flex-row lg:items-end">
        <div className="grid grid-cols-2 gap-3 lg:w-80">
          <label className="flex flex-col gap-1.5">
            <span className="micro-label">Dari Tanggal</span>
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => withReset(setFrom)(e.target.value)}
              aria-invalid={invalidRange}
              className="h-9 bg-white tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="micro-label">Sampai Tanggal</span>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => withReset(setTo)(e.target.value)}
              aria-invalid={invalidRange}
              className="h-9 bg-white tabular-nums"
            />
          </label>
        </div>

        <div className="flex flex-col gap-1.5 lg:w-72">
          <span className="micro-label">Pelanggan</span>
          <CustomerCombobox
            value={customer}
            onSelect={withReset(setCustomer)}
            placeholder="Semua pelanggan"
            className="h-9"
          />
        </div>

        {hasFilter && (
          <Button variant="outline" onClick={resetFilters} className="h-9 rounded-md bg-white lg:ml-auto">
            <X />
            Reset Filter
          </Button>
        )}
      </div>
      {invalidRange && (
        <p role="alert" className="-mt-3 text-xs text-red-600">
          Tanggal awal tidak boleh melebihi tanggal akhir.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : (
          <>
            <Table className={isPlaceholderData ? "opacity-60 transition-opacity duration-150" : undefined}>
              <TableHeader className="bg-zinc-50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="micro-label px-4">No. Pesanan</TableHead>
                  <TableHead className="micro-label px-4">Tanggal &amp; Waktu</TableHead>
                  <TableHead className="micro-label px-4">Pelanggan</TableHead>
                  <TableHead className="micro-label px-4">Kasir / Admin</TableHead>
                  <TableHead className="micro-label px-4 text-right">Total Nilai</TableHead>
                  <TableHead className="micro-label px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableSkeletonRows columns={COLUMNS} rows={PER_PAGE} />
                ) : orders.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNS}>
                      <EmptyState
                        icon={ReceiptText}
                        title={hasFilter ? "Tidak ada pesanan pada filter ini" : "Belum ada pesanan"}
                        description={
                          hasFilter
                            ? "Coba ubah rentang tanggal atau pelanggan."
                            : "Transaksi yang dibuat akan muncul di sini."
                        }
                        action={
                          hasFilter && (
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                              Reset Filter
                            </Button>
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="h-14 border-zinc-100 hover:bg-zinc-50/60">
                      <TableCell className="px-4">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-mono text-xs font-medium text-zinc-900 underline-offset-4 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 text-zinc-700 tabular-nums">
                        {formatTanggalWaktu(order.order_date)}
                      </TableCell>
                      <TableCell className="px-4">
                        <span className="font-medium text-zinc-900">{order.customer.customer_name}</span>
                        <span className="block text-xs text-zinc-500">{order.items_count} produk</span>
                      </TableCell>
                      <TableCell className="px-4 text-zinc-700">{order.user.name}</TableCell>
                      <TableCell className="px-4 text-right font-semibold text-zinc-900 tabular-nums">
                        {formatRupiah(order.total_amount)}
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2.5 text-xs font-medium text-zinc-900 transition-colors duration-150 hover:bg-zinc-50"
                        >
                          Lihat Faktur
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {meta && meta.total > 0 && (
              <DataPagination meta={meta} onPageChange={setPage} disabled={isPlaceholderData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
