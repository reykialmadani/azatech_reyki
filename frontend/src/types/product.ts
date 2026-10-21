export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  image_url: string | null;
  stock: number;
  price: string; // decimal dari backend, contoh "12000.00"
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  product_code: string;
  product_name: string;
  image_url: string | null;
  price: number;
  stock: number;
}

export type ProductSortField = "product_name" | "price" | "stock";
export type ProductSort = `${ProductSortField}:${"asc" | "desc"}`;

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: ProductSort;
}

// Aturan bisnis: stok < 5 dianggap menipis (dipakai tabel & dashboard).
export const LOW_STOCK_THRESHOLD = 5;
