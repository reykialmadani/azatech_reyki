import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

// Baris placeholder setinggi baris asli agar tidak terjadi lonjakan layout.
export function TableSkeletonRows({ rows = 6, columns }: { rows?: number; columns: number }) {
  return Array.from({ length: rows }, (_, r) => (
    <TableRow key={r} className="h-14 hover:bg-transparent">
      {Array.from({ length: columns }, (_, c) => (
        <TableCell key={c} className="px-4">
          <Skeleton className={c === 0 ? "h-4 w-16 bg-zinc-100" : "h-4 w-full max-w-40 bg-zinc-100"} />
        </TableCell>
      ))}
    </TableRow>
  ));
}
