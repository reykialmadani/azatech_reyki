"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { MobileNav } from "./mobile-nav";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import { UserMenu } from "./user-menu";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <MobileNav />
          <Brand />
        </div>

        <nav className="hidden h-full items-stretch gap-6 md:flex">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center border-b-2 text-sm transition-colors duration-150",
                  active
                    ? "border-black font-semibold text-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-900",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/orders/new"
            className="flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-zinc-800"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Pesanan Baru</span>
            <span className="sm:hidden">Baru</span>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
