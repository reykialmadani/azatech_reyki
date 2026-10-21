import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page harus bilangan bulat' })
  @Min(1, { message: 'page minimal 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'per_page harus bilangan bulat' })
  @Min(1, { message: 'per_page minimal 1' })
  @Max(100, { message: 'per_page maksimal 100' })
  per_page: number = 10;
}
