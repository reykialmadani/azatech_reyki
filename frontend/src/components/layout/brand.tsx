import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/dashboard" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-1.5", className)}>
      <span className="text-[15px] font-black tracking-[0.2em] text-black">AZATECH</span>
      <span className="rounded-sm bg-black px-1 py-px text-[9px] font-semibold tracking-wider text-white">
        STORE
      </span>
    </Link>
  );
}
