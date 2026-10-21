import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Package, ReceiptText, Users } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/orders", label: "Pesanan", icon: ReceiptText },
];

export const isNavActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
