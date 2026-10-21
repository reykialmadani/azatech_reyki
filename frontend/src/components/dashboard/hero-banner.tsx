import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ServerStatus = "checking" | "online" | "offline";

const STATUS_LABEL: Record<ServerStatus, string> = {
  checking: "Memeriksa server",
  online: "Server online",
  offline: "Server tidak terjangkau",
};

export function HeroBanner({ status }: { status: ServerStatus }) {
  return (
    <section className="flex min-h-32 flex-col justify-between gap-4 rounded-lg bg-black px-6 py-5 text-white sm:flex-row sm:items-center sm:px-8">
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              status === "online" && "bg-emerald-400",
              status === "offline" && "bg-red-500",
              status === "checking" && "bg-zinc-400",
            )}
          />
          {STATUS_LABEL[status]}
        </span>
        <h2 className="text-xl font-black tracking-[0.18em] sm:text-2xl">AZATECH STORE COLLECTION</h2>
        <p className="text-sm text-zinc-400">Sistem Manajemen Pesanan &amp; Inventaris Cepat</p>
      </div>
      <Link
        href="/products"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-md bg-white px-3 text-sm font-medium text-black transition-colors duration-150 hover:bg-zinc-200 sm:self-center"
      >
        Lihat Katalog Produk
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
