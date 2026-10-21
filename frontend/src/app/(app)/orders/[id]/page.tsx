import type { Metadata } from "next";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return <OrderDetailView id={Number(id)} />;
}
