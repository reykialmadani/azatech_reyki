import type { PrismaService } from '../../src/prisma/prisma.service.js';

let sequence = 0;
const next = () => ++sequence;

export function createProduct(
  prisma: PrismaService,
  overrides: Partial<{ productCode: string; productName: string; stock: number; price: number }> = {},
) {
  const n = next();
  return prisma.product.create({
    data: {
      productCode: `T${String(n).padStart(4, '0')}`,
      productName: `Produk Test ${n}`,
      stock: 10,
      price: 10_000,
      ...overrides,
    },
  });
}

export function createCustomer(
  prisma: PrismaService,
  overrides: Partial<{ customerName: string; phone: string | null }> = {},
) {
  const n = next();
  return prisma.customer.create({
    data: {
      customerName: `Pelanggan Test ${n}`,
      customerAddress: 'Jakarta',
      gender: 'Pria',
      birthDate: new Date('1995-02-10T00:00:00Z'),
      phone: null,
      ...overrides,
    },
  });
}
