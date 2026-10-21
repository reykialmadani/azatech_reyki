import type { Prisma } from '../../generated/prisma/client.js';

/**
 * Uang dikirim sebagai string 2 desimal ("12000.00") agar presisi Decimal
 * tidak hilang di JSON. Decimal#toString() bawaan memotong nol ("12000").
 */
export const formatMoney = (value: Prisma.Decimal): string => value.toFixed(2);
