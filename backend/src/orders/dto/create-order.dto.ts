import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  /** @example 1 */
  @IsInt({ message: 'Produk wajib dipilih' })
  @Min(1, { message: 'Produk wajib dipilih' })
  @Max(2_147_483_647, { message: 'Produk tidak valid' })
  product_id: number;

  /** @example 2 */
  @IsInt({ message: 'Jumlah harus bilangan bulat' })
  @Min(1, { message: 'Jumlah minimal 1' })
  @Max(1_000_000, { message: 'Jumlah terlalu besar' })
  quantity: number;
}

/**
 * Client hanya mengirim intensi transaksi. Harga, subtotal, dan total TIDAK
 * diterima dari client (field asing ditolak 422 oleh forbidNonWhitelisted).
 */
export class CreateOrderDto {
  /** @example 9d2f6c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f */
  @IsUUID('all', { message: 'Pilih pelanggan terlebih dahulu' })
  customer_id: string;

  @IsArray({ message: 'Item pesanan harus berupa array' })
  @ArrayMinSize(1, { message: 'Pesanan harus berisi minimal satu produk' })
  @ArrayMaxSize(100, { message: 'Maksimal 100 produk per pesanan' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
