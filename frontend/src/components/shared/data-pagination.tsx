import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types/api";

interface DataPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function DataPagination({ meta, onPageChange, disabled }: DataPaginationProps) {
  const { page, per_page, total, total_pages } = meta;
  const from = total === 0 ? 0 : (page - 1) * per_page + 1;
  const to = Math.min(page * per_page, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row">
      <p className="text-xs text-zinc-500 tabular-nums">
        Menampilkan {from}–{to} dari {total} data
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 tabular-nums">
          Halaman {page} dari {total_pages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Halaman sebelumnya"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Halaman berikutnya"
          disabled={disabled || page >= total_pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
