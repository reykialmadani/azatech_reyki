import { cn } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/types/product";

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) {
    return (
      <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-md bg-black px-2 text-xs font-medium text-white", className)}>
        Habis
      </span>
    );
  }

  if (stock < LOW_STOCK_THRESHOLD) {
    return (
      <span
        className={cn(
          "inline-flex h-6 items-center whitespace-nowrap gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-medium text-red-600 tabular-nums",
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-red-600" aria-hidden />
        Sisa {stock} unit
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-700 tabular-nums",
        className,
      )}
    >
      {stock} unit
    </span>
  );
}
