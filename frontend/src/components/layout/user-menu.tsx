"use client";

import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout, useMe } from "@/hooks/use-auth";
import { getInitials } from "@/lib/format";

export function UserMenu() {
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu profil"
        className="flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-900 transition-colors duration-150 outline-none hover:bg-zinc-100 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {user ? getInitials(user.name) : "··"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
            <span className="text-sm font-medium text-zinc-900">{user?.name ?? "Memuat…"}</span>
            <span className="truncate text-xs font-normal text-zinc-500">{user?.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut />
          {logout.isPending ? "Keluar…" : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
