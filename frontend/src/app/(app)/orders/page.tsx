import type { Metadata } from "next";
import { OrdersView } from "@/components/orders/orders-view";

export const metadata: Metadata = { title: "Riwayat Pesanan" };

export default function OrdersPage() {
  return <OrdersView />;
}
