import type { Product } from "./product";

export interface TopProduct {
  product_id: number;
  product_code: string;
  product_name: string;
  image_url: string | null;
  total_qty: number;
  total_amount: string;
}

export interface DailySales {
  date: string; // yyyy-MM-dd
  total_amount: string;
  transactions: number;
}

export interface DashboardSummary {
  total_sales: string;
  total_transactions: number;
  active_products: number;
  low_stock_count: number;
  top_products: TopProduct[]; // maksimal 5, urut qty terjual
  low_stock_products: Product[]; // stok < 5, urut stok paling sedikit
  daily_sales: DailySales[]; // 30 hari terakhir, termasuk hari tanpa transaksi
}
