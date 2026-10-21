import { Injectable } from '@nestjs/common';
import { toJakartaDateKey } from '../common/utils/jakarta-date.js';
import type { Prisma } from '../generated/prisma/client.js';

/**
 * Generator nomor order INV-YYYYMMDD-XXXX (tanggal WIB).
 *
 * Upsert pada `order_counters` menjadi `INSERT ... ON CONFLICT DO UPDATE` yang
 * atomik di Postgres dan mengunci baris counter hari itu sampai transaksi order
 * selesai. Hasilnya:
 *  - tidak ada nomor ganda walau order dibuat bersamaan,
 *  - jika order gagal (mis. stok kurang), increment ikut di-rollback → nomor tidak bolong.
 */
@Injectable()
export class OrderNumberService {
  async next(tx: Prisma.TransactionClient, orderDate: Date): Promise<string> {
    const dateKey = toJakartaDateKey(orderDate);
    const counter = await tx.orderCounter.upsert({
      where: { date: dateKey },
      create: { date: dateKey, lastSeq: 1 },
      update: { lastSeq: { increment: 1 } },
    });
    return `INV-${dateKey}-${String(counter.lastSeq).padStart(4, '0')}`;
  }
}
