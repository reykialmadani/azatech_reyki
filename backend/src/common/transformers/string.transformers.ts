import { Transform } from 'class-transformer';

/** Trim spasi di awal/akhir string. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/** Trim + uppercase, mis. kode produk "p0001 " → "P0001". */
export const TrimUpper = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  );

/** Field opsional: string kosong / spasi saja diperlakukan sebagai null. */
export const TrimToNull = () =>
  Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
