import type { Product } from '../generated/prisma/client.js';
import { formatMoney } from '../common/utils/money.js';

export interface ProductResponse {
  id: number;
  product_code: string;
  product_name: string;
  image_url: string | null;
  stock: number;
  price: string;
  created_at: Date;
  updated_at: Date;
}

/** Model Prisma (camelCase) → kontrak API (snake_case). `deleted_at` tidak diekspos. */
export const toProductResponse = (product: Product): ProductResponse => ({
  id: product.id,
  product_code: product.productCode,
  product_name: product.productName,
  image_url: product.imageUrl,
  stock: product.stock,
  price: formatMoney(product.price),
  created_at: product.createdAt,
  updated_at: product.updatedAt,
});
