/**
 * Seeder: 1 admin, 22 produk, 15 pelanggan, 30 order dalam 30 hari terakhir.
 *
 * - Deterministik (faker.seed) → data sama di setiap mesin.
 * - Aman diulang: admin/produk/pelanggan di-upsert; order hanya dibuat jika tabel orders kosong.
 * - Order dibuat dengan aturan yang sama seperti API: stok dipotong secara bersyarat dalam
 *   transaksi, harga di-snapshot, nomor INV-YYYYMMDD-XXXX dari OrderNumberService.
 */
import { fakerID_ID as faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import 'dotenv/config';
import { startOfJakartaDay, lastJakartaDates } from '../src/common/utils/jakarta-date.js';
import { Gender, Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { OrderNumberService } from '../src/orders/order-number.service.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});
faker.seed(20261021);

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&q=70&auto=format&fit=crop`;

// [kode, nama, harga, stok awal, gambar]. Stok awal sebagian sengaja kecil agar
// dashboard punya contoh "stok menipis". P0001 tanpa gambar → contoh fallback ikon.
const PRODUCTS: Array<[string, string, number, number, string | null]> = [
  ['P0001', 'Hydrococo 150ml', 12000, 60, null],
  ['P0002', 'Kopi Latte Literan 1L', 45000, 25, img('1509042239860-f550ce710b93')],
  ['P0003', 'Es Teh Lemon 350ml', 8000, 80, img('1556679343-c7306c1976bc')],
  ['P0004', 'Air Mineral 600ml', 4000, 120, img('1523362628745-0c100150b504')],
  ['P0005', 'Mie Goreng Instan', 3500, 150, img('1612929633738-8fe44f7ec841')],
  ['P0006', 'Beras Premium 5kg', 78000, 20, img('1586201375761-83865001e31c')],
  ['P0007', 'Susu UHT Full Cream 1L', 21000, 40, img('1563636619-e9143da7973b')],
  ['P0008', 'Roti Gandum Utuh', 18500, 30, img('1509440159596-0249088772ff')],
  ['P0009', 'Telur Ayam 10 Butir', 27000, 35, img('1582722872445-44dc5f7e3c8f')],
  ['P0010', 'Minyak Zaitun 250ml', 65000, 7, img('1474979266404-7eaacbcd87c5')],
  ['P0011', 'Keripik Kentang 68g', 11000, 70, img('1566478989037-eec170784d0b')],
  ['P0012', 'Cokelat Batang Almond 100g', 24500, 45, img('1606312619070-d48b4c652a52')],
  ['P0013', 'Sabun Batang Lavender', 9500, 55, img('1600857544200-b2f666a9a2ec')],
  ['P0014', 'Sampo Botol 340ml', 32000, 4, img('1631729371254-42c2892f0e6e')],
  ['P0015', 'Pisang Cavendish 1 Sisir', 25000, 30, img('1571771894821-ce9b6c11b08e')],
  ['P0016', 'Apel Fuji 1kg', 42000, 25, img('1560806887-1e4cd0b6cbd6')],
  ['P0017', 'Jus Jeruk 250ml', 9000, 60, img('1600271886742-f049cd451bba')],
  ['P0018', 'Minuman Soda Kaleng 330ml', 7500, 90, img('1622483767028-3f66f32aef97')],
  ['P0019', 'Jeruk Medan 1kg', 30000, 9, img('1536657464919-892534f60d6e')],
  ['P0020', 'Puding Stroberi Cup', 6500, 50, img('1488477181946-6428a0291777')],
  ['P0021', 'Kukis Cokelat Chip 200g', 22000, 40, img('1499636136210-6f4ee915583e')],
  ['P0022', 'Biji Kopi Arabika 250g', 85000, 3, img('1559056199-641a0ac8b55e')],
];

const CUSTOMER_COUNT = 15;
const ORDER_COUNT = 30;
const DAYS = 30;
const STOCK_RESERVE = 2;

async function seedAdmin() {
  const email = (process.env['SEED_ADMIN_EMAIL'] ?? 'admin@azatech.id').toLowerCase();
  const password = process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin123!';
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Admin AZA', email, password: await argon2.hash(password) },
  });
}

async function seedProducts() {
  for (const [productCode, productName, price, stock, imageUrl] of PRODUCTS) {
    await prisma.product.upsert({
      where: { productCode },
      update: {}, // jangan menimpa perubahan yang dibuat lewat aplikasi
      create: { productCode, productName, price, stock, imageUrl },
    });
  }
}

async function seedCustomers() {
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const gender = i % 2 === 0 ? Gender.Pria : Gender.Wanita;
    const id = faker.string.uuid();
    const data = {
      customerName: faker.person.fullName({ sex: gender === Gender.Pria ? 'male' : 'female' }),
      customerAddress: `${faker.location.streetAddress()}, ${faker.location.city()}`,
      gender,
      birthDate: new Date(`${faker.date.birthdate({ mode: 'age', min: 18, max: 60 }).toISOString().slice(0, 10)}T00:00:00Z`),
      // ±1 dari 5 pelanggan tanpa nomor HP (kolom opsional).
      phone: i % 5 === 4 ? null : `08${faker.string.numeric(10)}`,
    };
    await prisma.customer.upsert({ where: { id }, update: {}, create: { id, ...data } });
  }
}

/** Tanggal acak dalam 30 hari terakhir (WIB), jam buka toko 08:00–21:00, tidak di masa depan. */
function randomOrderDates(): Date[] {
  const days = lastJakartaDates(DAYS);
  const now = Date.now();
  return Array.from({ length: ORDER_COUNT }, () => {
    const day = startOfJakartaDay(faker.helpers.arrayElement(days)).getTime();
    const minutes = faker.number.int({ min: 8 * 60, max: 21 * 60 });
    return new Date(Math.min(day + minutes * 60_000, now - 60_000));
  }).sort((a, b) => a.getTime() - b.getTime()); // urut waktu → nomor harian berurutan
}

async function seedOrders(adminId: string) {
  if ((await prisma.order.count()) > 0) {
    console.log('  orders sudah ada → dilewati (seed aman diulang)');
    return;
  }
  const customers = await prisma.customer.findMany({ where: { deletedAt: null }, select: { id: true } });
  const orderNumbers = new OrderNumberService();

  for (const orderDate of randomOrderDates()) {
    await prisma.$transaction(async (tx) => {
      // Sisakan minimal 2 unit per produk agar demo "stok menipis" tidak semuanya 0.
      const available = await tx.product.findMany({
        where: { deletedAt: null, stock: { gt: STOCK_RESERVE } },
        select: { id: true, price: true, stock: true },
      });
      const picked = faker.helpers.arrayElements(available, { min: 1, max: 4 });

      const items = [];
      for (const product of picked.sort((a, b) => a.id - b.id)) {
        const quantity = faker.number.int({
          min: 1,
          max: Math.min(5, product.stock - STOCK_RESERVE),
        });
        const { count } = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (count === 0) continue;
        items.push({ productId: product.id, quantity, unitPrice: product.price, subtotal: product.price.mul(quantity) });
      }
      if (items.length === 0) return;

      await tx.order.create({
        data: {
          orderNumber: await orderNumbers.next(tx, orderDate),
          orderDate,
          createdAt: orderDate,
          customerId: faker.helpers.arrayElement(customers).id,
          createdBy: adminId,
          totalAmount: items.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0)),
          items: { create: items.map((item) => ({ ...item, createdAt: orderDate })) },
        },
      });
    });
  }
}

async function main() {
  console.log('Seeding database...');
  const admin = await seedAdmin();
  await seedProducts();
  await seedCustomers();
  await seedOrders(admin.id);

  const [users, products, customers, orders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.order.count(),
  ]);
  console.log(`  users=${users} products=${products} customers=${customers} orders=${orders}`);
  console.log(`  login: ${admin.email} / ${process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin123!'}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
