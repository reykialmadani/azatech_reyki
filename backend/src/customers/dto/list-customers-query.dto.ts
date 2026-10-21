import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Trim } from '../../common/transformers/string.transformers.js';

export class ListCustomersQueryDto extends PaginationQueryDto {
  /** Cari di nama (case-insensitive) atau nomor HP. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100, { message: 'Kata kunci maksimal 100 karakter' })
  search?: string;
}
