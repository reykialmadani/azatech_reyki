import { Prisma } from '../../generated/prisma/client.js';

/** Pelanggaran unique constraint (mis. race dua request membuat kode yang sama). */
export const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
