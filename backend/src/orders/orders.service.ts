import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import {
  ApiException,
  type FieldErrors,
  ValidationFailedException,
} from '../common/exceptions/api.exception.js';
import { startOfJakartaDay, startOfNextJakartaDay } from '../common/utils/jakarta-date.js';
import { paginate, toSkipTake } from '../common/utils/pagination.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { OrderNumberService } from './order-number.service.js';
import {
  orderDetailInclude,
  orderSummaryInclude,
  toOrderDetail,
  toOrderSummary,
} from './order.mapper.js';

type Tx = Prisma.TransactionClient;
type ProductRow = { id: number; productName: string; price: Prisma.Decimal };
interface OrderLine {
  index: number;
  productId: number;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderNumbers: OrderNumberService,
  ) {}

  /**
   * Membuat order secara atomik dalam SATU transaksi database:
   * validasi customer & produk → potong stok bersyarat → hitung harga di server →
   * nomor order → simpan. Error di langkah mana pun me-rollback semuanya
   * (stok, counter nomor order, order, item).
   */
  async create(dto: CreateOrderDto, userId: string) {
    const lines = dto.items.map((item, index) => ({
      index,
      productId: item.product_id,
      quantity: item.quantity,
    }));
    assertNoDuplicateProducts(lines);

    const order = await this.prisma.$transaction(async (tx) => {
      await this.assertActiveCustomer(tx, dto.customer_id);
      const products = await this.findActiveProducts(tx, lines);
      await this.decrementStock(tx, lines, products);

      // Harga diambil dari DB (snapshot), bukan dari client.
      const items = lines.map(({ productId, quantity }) => {
        const unitPrice = products.get(productId)!.price;
        return { productId, quantity, unitPrice, subtotal: unitPrice.mul(quantity) };
      });
      const totalAmount = items.reduce(
        (sum, item) => sum.add(item.subtotal),
        new Prisma.Decimal(0),
      );

      const orderDate = new Date();
      return tx.order.create({
        data: {
          orderNumber: await this.orderNumbers.next(tx, orderDate),
          orderDate,
          customerId: dto.customer_id,
          createdBy: userId,
          totalAmount,
          items: { create: items },
        },
        include: orderDetailInclude,
      });
    });

    return toOrderDetail(order);
  }

  async list({ page, per_page, from, to, customer_id }: ListOrdersQueryDto) {
    if (from && to && from > to) {
      throw new ValidationFailedException({
        to: ['Tanggal akhir tidak boleh sebelum tanggal awal'],
      });
    }

    // Rentang tanggal mengikuti hari kalender WIB; `to` inklusif sampai akhir hari.
    const where: Prisma.OrderWhereInput = {
      ...(customer_id && { customerId: customer_id }),
      ...((from || to) && {
        orderDate: {
          ...(from && { gte: startOfJakartaDay(from) }),
          ...(to && { lt: startOfNextJakartaDay(to) }),
        },
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderSummaryInclude,
        orderBy: [{ orderDate: 'desc' }, { id: 'desc' }],
        ...toSkipTake(page, per_page),
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map(toOrderSummary), total, page, per_page);
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderDetailInclude,
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return toOrderDetail(order);
  }

  private async assertActiveCustomer(tx: Tx, customerId: string) {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { id: true },
    });
    if (!customer) {
      throw new ValidationFailedException({ customer_id: ['Pelanggan tidak ditemukan'] });
    }
  }

  private async findActiveProducts(tx: Tx, lines: OrderLine[]) {
    const rows = await tx.product.findMany({
      where: { id: { in: lines.map((line) => line.productId) }, deletedAt: null },
      select: { id: true, productName: true, price: true },
    });
    const products = new Map<number, ProductRow>(rows.map((row) => [row.id, row]));

    const errors: FieldErrors = {};
    for (const line of lines) {
      if (!products.has(line.productId)) {
        errors[`items.${line.index}.product_id`] = [
          'Produk tidak ditemukan atau sudah diarsipkan',
        ];
      }
    }
    if (Object.keys(errors).length > 0) throw new ValidationFailedException(errors);
    return products;
  }

  /**
   * `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty`
   * — cek dan potong stok dalam satu statement atomik (bukan baca-lalu-tulis),
   * jadi dua order bersamaan tidak bisa sama-sama mengambil stok terakhir.
   * Diproses urut product_id agar urutan lock konsisten antar transaksi (anti deadlock).
   * Semua item dicek dulu supaya setiap baris yang gagal mendapat pesan errornya sendiri.
   */
  private async decrementStock(tx: Tx, lines: OrderLine[], products: Map<number, ProductRow>) {
    const errors: FieldErrors = {};
    const byProductId = [...lines].sort((a, b) => a.productId - b.productId);

    for (const line of byProductId) {
      const { count } = await tx.product.updateMany({
        where: { id: line.productId, deletedAt: null, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (count === 1) continue;

      const current = await tx.product.findUnique({
        where: { id: line.productId },
        select: { stock: true },
      });
      const name = products.get(line.productId)!.productName;
      errors[`items.${line.index}.quantity`] = [
        `Stok ${name} tersisa ${current?.stock ?? 0}, diminta ${line.quantity}`,
      ];
    }

    if (Object.keys(errors).length > 0) {
      throw new ApiException(HttpStatus.CONFLICT, 'Stok tidak mencukupi', errors);
    }
  }
}

function assertNoDuplicateProducts(lines: OrderLine[]) {
  const seen = new Set<number>();
  const errors: FieldErrors = {};
  for (const line of lines) {
    if (seen.has(line.productId)) {
      errors[`items.${line.index}.product_id`] = [
        'Produk yang sama sudah ada di baris lain; ubah jumlahnya saja',
      ];
    }
    seen.add(line.productId);
  }
  if (Object.keys(errors).length > 0) throw new ValidationFailedException(errors);
}
