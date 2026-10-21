import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Trim } from '../../common/transformers/string.transformers.js';

export const PRODUCT_SORT_FIELDS = ['product_name', 'price', 'stock'] as const;
export const PRODUCT_SORTS = PRODUCT_SORT_FIELDS.flatMap((field) => [
  `${field}:asc`,
  `${field}:desc`,
]);

export class ListProductsQueryDto extends PaginationQueryDto {
  /** Cari di nama atau kode produk (case-insensitive). */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100, { message: 'Kata kunci maksimal 100 karakter' })
  search?: string;

  /** Format `<field>:<asc|desc>`. @example price:desc */
  @IsOptional()
  @IsIn(PRODUCT_SORTS, { message: `sort harus salah satu dari: ${PRODUCT_SORTS.join(', ')}` })
  sort: string = 'product_name:asc';
}
