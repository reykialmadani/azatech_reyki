import { Injectable } from '@nestjs/common';
import { lastJakartaDates, startOfJakartaDay } from '../common/utils/jakarta-date.js';
import { formatMoney } from '../common/utils/money.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { toProductResponse } from '../products/product.mapper.js';

/** Aturan bisnis: stok < 5 dianggap menipis (sama dengan frontend). */
export const LOW_STOCK_THRESHOLD = 5;
const TOP_PRODUCTS_LIMIT = 5;
const DAILY_SALES_DAYS = 30;

interface DailySalesRow {
  day: string;
  total_amount: string;
  transactions: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [totals, activeProducts, lowStock, topProducts, dailySales] = await Promise.all([
      this.prisma.order.aggregate({ _count: { _all: true }, _sum: { totalAmount: true } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.findMany({
        where: { deletedAt: null, stock: { lt: LOW_STOCK_THRESHOLD } },
        orderBy: [{ stock: 'asc' }, { productName: 'asc' }],
      }),
      this.topProducts(),
      this.dailySales(),
    ]);

    return {
      total_sales: formatMoney(totals._sum.totalAmount ?? new Prisma.Decimal(0)),
      total_transactions: totals._count._all,
      active_products: activeProducts,
      low_stock_count: lowStock.length,
      top_products: topProducts,
      low_stock_products: lowStock.map(toProductResponse),
      daily_sales: dailySales,
    };
  }

  /** 5 produk terlaris berdasarkan qty; produk yang sudah diarsipkan tetap dihitung. */
  private async topProducts() {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      orderBy: [{ _sum: { quantity: 'desc' } }, { productId: 'asc' }],
      take: TOP_PRODUCTS_LIMIT,
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((row) => row.productId) } },
      select: { id: true, productCode: true, productName: true, imageUrl: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return grouped.flatMap((row) => {
      const product = byId.get(row.productId);
      if (!product) return [];
      return [
        {
          product_id: product.id,
          product_code: product.productCode,
          product_name: product.productName,
          image_url: product.imageUrl,
          total_qty: row._sum.quantity ?? 0,
          total_amount: formatMoney(row._sum.subtotal ?? new Prisma.Decimal(0)),
        },
      ];
    });
  }

  /**
   * Penjualan harian 30 hari terakhir per tanggal WIB. Hari tanpa transaksi
   * tetap muncul dengan nilai 0 agar grafik tidak "melompat".
   */
  private async dailySales() {
    const dates = lastJakartaDates(DAILY_SALES_DAYS);
    const since = startOfJakartaDay(dates[0]!);

    // order_date disimpan sebagai timestamp UTC → konversi ke tanggal WIB di SQL.
    const rows = await this.prisma.$queryRaw<DailySalesRow[]>`
      SELECT to_char((order_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day,
             SUM(total_amount)::numeric(14, 2)::text AS total_amount,
             COUNT(*)::int AS transactions
      FROM orders
      WHERE order_date >= ${since}
      GROUP BY day
    `;
    const byDay = new Map(rows.map((row) => [row.day, row]));

    return dates.map((date) => ({
      date,
      total_amount: byDay.get(date)?.total_amount ?? '0.00',
      transactions: byDay.get(date)?.transactions ?? 0,
    }));
  }
}
