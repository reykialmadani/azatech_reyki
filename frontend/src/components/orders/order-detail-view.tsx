"use client";

import Link from "next/link";
import { ArrowLeft, FileX2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useOrder } from "@/hooks/use-orders";
import { isApiError } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/form-errors";
import { OrderInvoiceView } from "./order-invoice-view";

export function OrderDetailView({ id }: { id: number }) {
  const { data: order, isPending, isError, error, refetch } = useOrder(id);
  const notFound = !Number.isInteger(id) || id <= 0 || (isApiError(error) && error.status === 404);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/orders"
          className="flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-zinc-600 transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <ArrowLeft className="size-4" />
          Riwayat Pesanan
        </Link>
        {order && (
          <Button onClick={() => window.print()} className="h-9 rounded-md bg-black px-3 text-white hover:bg-zinc-800">
            <Printer />
            Cetak Faktur
          </Button>
        )}
      </div>

      {notFound ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <EmptyState
            icon={FileX2}
            title="Pesanan tidak ditemukan"
            description="Nomor pesanan ini tidak ada atau sudah tidak tersedia."
            action={
              <Link
                href="/orders"
                className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-sm hover:bg-zinc-50"
              >
                Kembali ke riwayat
              </Link>
            }
          />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <InvoiceSkeleton />
      ) : (
        <OrderInvoiceView order={order} />
      )}
    </div>
  );
}

function InvoiceSkeleton() {
  return (
    <div className="space-y-8 rounded-lg border border-zinc-200 bg-white p-8" aria-busy="true">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-32 bg-zinc-100" />
        <div className="space-y-2">
          <Skeleton className="ml-auto h-5 w-48 bg-zinc-100" />
          <Skeleton className="ml-auto h-4 w-32 bg-zinc-100" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 bg-zinc-100" />
        <Skeleton className="h-4 w-56 bg-zinc-100" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-zinc-100" />
        ))}
      </div>
      <Skeleton className="ml-auto h-8 w-56 bg-zinc-100" />
    </div>
  );
}
