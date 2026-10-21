"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { errorMessage } from "@/lib/api/form-errors";
import { formatTanggal } from "@/lib/format";
import { HeroBanner } from "./hero-banner";
import { KpiCards, KpiCardsSkeleton } from "./kpi-cards";
import { LowStockCard } from "./low-stock-card";
import { SalesChart } from "./sales-chart";
import { TopProductsCard } from "./top-products-card";

export function DashboardView() {
  const { data: summary, isPending, isError, error, refetch } = useDashboardSummary();
  const status = isPending ? "checking" : isError ? "offline" : "online";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description={`Ringkasan performa toko · ${formatTanggal(new Date())}`} />
      <HeroBanner status={status} />

      {isError ? (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <>
          <KpiCardsSkeleton />
          <Skeleton className="h-[22rem] rounded-lg bg-zinc-100" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-lg bg-zinc-100" />
            <Skeleton className="h-96 rounded-lg bg-zinc-100" />
          </div>
        </>
      ) : (
        <>
          <KpiCards summary={summary} />
          <SalesChart data={summary.daily_sales} />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <TopProductsCard products={summary.top_products} />
            <LowStockCard products={summary.low_stock_products} />
          </div>
        </>
      )}
    </div>
  );
}
