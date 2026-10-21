import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { IsIsoDate } from '../../common/validators/is-past-iso-date.validator.js';

export class ListOrdersQueryDto extends PaginationQueryDto {
  /** Tanggal awal (inklusif, WIB). @example 2026-10-01 */
  @IsOptional()
  @IsIsoDate({ message: 'Tanggal awal harus berformat YYYY-MM-DD' })
  from?: string;

  /** Tanggal akhir (inklusif sampai 23:59:59 WIB). @example 2026-10-21 */
  @IsOptional()
  @IsIsoDate({ message: 'Tanggal akhir harus berformat YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsUUID('all', { message: 'customer_id tidak valid' })
  customer_id?: string;
}
