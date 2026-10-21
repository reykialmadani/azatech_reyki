import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Pesanan Baru" };

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesanan Baru"
        description="Pilih pelanggan, tambahkan produk, lalu proses transaksi."
        actions={
          <Link
            href="/orders"
            className="flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 transition-colors duration-150 hover:bg-zinc-50"
          >
            <ArrowLeft className="size-4" />
            Riwayat Pesanan
          </Link>
        }
      />
      <OrderForm />
    </div>
  );
}
