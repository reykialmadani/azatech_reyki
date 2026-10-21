import { NotFoundException, type PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

const MAX_INT = 2_147_483_647; // batas kolom INTEGER Postgres

/**
 * Id yang formatnya mustahil ada di DB (bukan angka, overflow, bukan UUID)
 * dijawab 404 — dari sudut pandang client, resource itu memang tidak ada.
 * Dipakai sebagai instance: @Param('id', new IntIdPipe('Produk tidak ditemukan')).
 */
export class IntIdPipe implements PipeTransform<string, number> {
  constructor(private readonly notFoundMessage: string) {}

  transform(value: string): number {
    const id = /^\d+$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(id) || id < 1 || id > MAX_INT) {
      throw new NotFoundException(this.notFoundMessage);
    }
    return id;
  }
}

export class UuidPipe implements PipeTransform<string, string> {
  constructor(private readonly notFoundMessage: string) {}

  transform(value: string): string {
    if (!isUUID(value)) throw new NotFoundException(this.notFoundMessage);
    return value;
  }
}
