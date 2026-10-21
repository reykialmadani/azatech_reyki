import type { Customer } from "./customer";
import type { Product } from "./product";

export interface Order {
  id: number;
  order_number: string; // INV-YYYYMMDD-XXXX, digenerate server
  customer_id: string;
  created_by: string;
  order_date: string;
  total_amount: string; // decimal dihitung server
  created_at: string;
  updated_at: string;
  customer: Pick<Customer, "id" | "customer_name" | "phone" | "customer_address">;
  user: { id: string; name: string };
  items_count: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string; // snapshot harga saat transaksi
  subtotal: string;
  product: Pick<Product, "id" | "product_code" | "product_name" | "image_url">;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

// Aturan bisnis: client hanya mengirim intensi transaksi, tanpa harga / total.
export interface CreateOrderPayload {
  customer_id: string;
  items: Array<{ product_id: number; quantity: number }>;
}

export interface OrderListParams {
  page?: number;
  per_page?: number;
  from?: string; // yyyy-MM-dd
  to?: string;
  customer_id?: string;
}
