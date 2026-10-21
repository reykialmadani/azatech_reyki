import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Package, ReceiptText, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardSummary } from "@/types/dashboard";

export function KpiCards({ summary }: { summary: DashboardSummary }) {
  const lowStock = summary.low_stock_count;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={Wallet} label="Total Penjualan" value={formatRupiah(summary.total_sales)} />
      <KpiCard
        icon={ReceiptText}
        label="Total Transaksi"
        value={summary.total_transactions.toLocaleString("id-ID")}
        unit="transaksi"
      />
      <KpiCard
        icon={Package}
        label="Produk Aktif"
        value={summary.active_products.toLocaleString("id-ID")}
        unit="produk"
      />
      <KpiCard
        icon={AlertTriangle}
        label="Stok Rendah (< 5)"
        value={lowStock.toLocaleString("id-ID")}
        unit="produk"
        alert={lowStock > 0}
        note={lowStock > 0 ? "Perlu restock segera" : "Semua stok aman"}
      />
    </div>
  );
}

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  note?: string;
  alert?: boolean;
}

function KpiCard({ icon: Icon, label, value, unit, note, alert }: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-white p-5",
        alert ? "border-red-200 bg-red-50" : "border-zinc-200",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("micro-label", alert && "text-red-600")}>{label}</span>
        <Icon className={cn("size-4", alert ? "text-red-600" : "text-zinc-400")} strokeWidth={1.5} aria-hidden />
      </div>
      <p className={cn("text-2xl font-semibold tracking-tight", alert ? "text-red-600" : "text-zinc-900")}>
        {value}
        {unit && <span className="ml-1.5 text-sm font-normal text-zinc-500">{unit}</span>}
      </p>
      {note && <p className={cn("text-xs", alert ? "text-red-600" : "text-zinc-500")}>{note}</p>}
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex h-[118px] flex-col gap-4 rounded-lg border border-zinc-200 p-5">
          <Skeleton className="h-3 w-24 bg-zinc-100" />
          <Skeleton className="h-7 w-36 bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}
