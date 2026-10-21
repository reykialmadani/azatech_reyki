import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ApiException } from '../common/exceptions/api.exception.js';
import { paginate, toSkipTake } from '../common/utils/pagination.js';
import { isUniqueViolation } from '../common/utils/prisma-errors.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import type { ListProductsQueryDto } from './dto/list-products-query.dto.js';
import { toProductResponse } from './product.mapper.js';

const SORT_COLUMNS = {
  product_name: 'productName',
  price: 'price',
  stock: 'stock',
} as const satisfies Record<string, keyof Prisma.ProductOrderByWithRelationInput>;

const NOT_FOUND = 'Produk tidak ditemukan';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ page, per_page, search, sort }: ListProductsQueryDto) {
    const [field, direction] = sort.split(':') as [keyof typeof SORT_COLUMNS, 'asc' | 'desc'];
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { productName: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        // id sebagai tie-breaker agar urutan stabil antar halaman.
        orderBy: [{ [SORT_COLUMNS[field]]: direction }, { id: 'asc' }],
        ...toSkipTake(page, per_page),
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(rows.map(toProductResponse), total, page, per_page);
  }

  async findOne(id: number) {
    return toProductResponse(await this.findActiveOrThrow(id));
  }

  async create(dto: CreateProductDto) {
    await this.assertCodeAvailable(dto.product_code);
    try {
      const product = await this.prisma.product.create({ data: toData(dto) });
      return toProductResponse(product);
    } catch (error) {
      throw isUniqueViolation(error) ? duplicateCode(dto.product_code) : error;
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findActiveOrThrow(id);
    await this.assertCodeAvailable(dto.product_code, id);
    try {
      const product = await this.prisma.product.update({ where: { id }, data: toData(dto) });
      return toProductResponse(product);
    } catch (error) {
      throw isUniqueViolation(error) ? duplicateCode(dto.product_code) : error;
    }
  }

  /** Soft delete: baris tetap ada agar order_items lama tetap valid. */
  async remove(id: number): Promise<void> {
    const { count } = await this.prisma.product.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException(NOT_FOUND);
  }

  private async findActiveOrThrow(id: number) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException(NOT_FOUND);
    return product;
  }

  /** Kode unik berlaku juga untuk produk yang sudah di-soft-delete (constraint DB). */
  private async assertCodeAvailable(code: string, exceptId?: number) {
    const existing = await this.prisma.product.findUnique({
      where: { productCode: code },
      select: { id: true },
    });
    if (existing && existing.id !== exceptId) throw duplicateCode(code);
  }
}

const toData = (dto: CreateProductDto) => ({
  productCode: dto.product_code,
  productName: dto.product_name,
  imageUrl: dto.image_url ?? null,
  price: dto.price,
  stock: dto.stock,
});

const duplicateCode = (code: string) =>
  new ApiException(HttpStatus.CONFLICT, 'Kode produk sudah digunakan', {
    product_code: [`Kode ${code} sudah digunakan`],
  });
