import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate, toSkipTake } from '../common/utils/pagination.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { fromIsoDateOnly, toCustomerResponse } from './customer.mapper.js';
import type { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import type { ListCustomersQueryDto } from './dto/list-customers-query.dto.js';

const NOT_FOUND = 'Pelanggan tidak ditemukan';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ page, per_page, search }: ListCustomersQueryDto) {
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: [{ customerName: 'asc' }, { id: 'asc' }],
        ...toSkipTake(page, per_page),
      }),
      this.prisma.customer.count({ where }),
    ]);
    return paginate(rows.map(toCustomerResponse), total, page, per_page);
  }

  async findOne(id: string) {
    return toCustomerResponse(await this.findActiveOrThrow(id));
  }

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({ data: toData(dto) });
    return toCustomerResponse(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findActiveOrThrow(id);
    const customer = await this.prisma.customer.update({ where: { id }, data: toData(dto) });
    return toCustomerResponse(customer);
  }

  /** Soft delete: order lama tetap menampilkan data pelanggan ini. */
  async remove(id: string): Promise<void> {
    const { count } = await this.prisma.customer.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException(NOT_FOUND);
  }

  private async findActiveOrThrow(id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException(NOT_FOUND);
    return customer;
  }
}

const toData = (dto: CreateCustomerDto) => ({
  customerName: dto.customer_name,
  customerAddress: dto.customer_address,
  gender: dto.gender,
  birthDate: fromIsoDateOnly(dto.birth_date),
  phone: dto.phone ?? null,
});
