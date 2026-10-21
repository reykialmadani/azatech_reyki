import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CustomerAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-700",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
