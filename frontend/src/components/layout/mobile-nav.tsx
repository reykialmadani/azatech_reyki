"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NAV_ITEMS, isNavActive } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Buka navigasi"
        className="-ml-1.5 flex size-8 items-center justify-center rounded-md text-zinc-900 transition-colors duration-150 hover:bg-zinc-100 md:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-0 shadow-none">
        <SheetHeader className="h-14 justify-center border-b border-zinc-200 px-5">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <Brand />
        </SheetHeader>
        <nav className="flex flex-col p-3">
          <span className="micro-label px-2 pt-2 pb-3">Menu</span>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-zinc-100 font-semibold text-black"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
