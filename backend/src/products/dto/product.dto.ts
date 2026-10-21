import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Trim, TrimToNull, TrimUpper } from '../../common/transformers/string.transformers.js';

/** Payload tambah produk. PUT memakai payload lengkap yang sama (full replace). */
export class CreateProductDto {
  /** Unik, disimpan uppercase. @example P0001 */
  @TrimUpper()
  @IsString({ message: 'Kode produk wajib diisi' })
  @IsNotEmpty({ message: 'Kode produk wajib diisi' })
  @MaxLength(20, { message: 'Kode produk maksimal 20 karakter' })
  @Matches(/^[A-Z0-9-]+$/, { message: 'Kode produk hanya boleh huruf, angka, dan tanda hubung' })
  product_code: string;

  /** @example Hydrococo 150ml */
  @Trim()
  @IsString({ message: 'Nama produk wajib diisi' })
  @IsNotEmpty({ message: 'Nama produk wajib diisi' })
  @MaxLength(150, { message: 'Nama produk maksimal 150 karakter' })
  product_name: string;

  /** URL gambar opsional (http/https). @example https://images.unsplash.com/photo-1 */
  @TrimToNull()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'URL gambar harus diawali http:// atau https://' },
  )
  @MaxLength(500, { message: 'URL gambar maksimal 500 karakter' })
  image_url?: string | null;

  /** Harga satuan, > 0, maksimal 2 desimal. @example 12000 */
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Harga harus berupa angka (maks. 2 desimal)' })
  @IsPositive({ message: 'Harga harus lebih dari 0' })
  @Max(9_999_999_999.99, { message: 'Harga terlalu besar' })
  price: number;

  /** @example 10 */
  @IsInt({ message: 'Stok harus bilangan bulat' })
  @Min(0, { message: 'Stok tidak boleh negatif' })
  @Max(2_147_483_647, { message: 'Stok terlalu besar' })
  stock: number;
}

export class UpdateProductDto extends CreateProductDto {}
