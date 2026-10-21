import request from 'supertest';
import { toJakartaDateKey } from '../src/common/utils/jakarta-date.js';
import { createAdmin, login } from './helpers/auth.js';
import { createCustomer, createProduct } from './helpers/factories.js';
import { createTestApp, resetDatabase, type TestContext } from './helpers/test-app.js';

describe('Orders (e2e)', () => {
  let ctx: TestContext;
  let token: string;
  let adminId: string;
  const http = () => request(ctx.app.getHttpServer());
  const postOrder = (body: object) =>
    http().post('/api/orders').set('Authorization', `Bearer ${token}`).send(body);
  const get = (url: string) => http().get(url).set('Authorization', `Bearer ${token}`);
  const stockOf = async (id: number) =>
    (await ctx.prisma.product.findUniqueOrThrow({ where: { id } })).stock;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    adminId = (await createAdmin(ctx.prisma)).id;
    ({ access_token: token } = await login(ctx.app));
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('POST /api/orders', () => {
    it('sukses → 201, harga & total dihitung server, stok berkurang, nomor INV berurutan', async () => {
      const customer = await createCustomer(ctx.prisma);
      const hydro = await createProduct(ctx.prisma, { productName: 'Hydrococo 150ml', price: 12000, stock: 10 });
      const kopi = await createProduct(ctx.prisma, { productName: 'Kopi', price: 7500.5, stock: 5 });

      const res = await postOrder({
        customer_id: customer.id,
        items: [
          { product_id: hydro.id, quantity: 2 },
          { product_id: kopi.id, quantity: 3 },
        ],
      }).expect(201);

      const today = toJakartaDateKey(new Date());
      expect(res.body).toMatchObject({
        success: true,
        message: 'Pesanan berhasil dibuat',
        data: {
          order_number: `INV-${today}-0001`,
          customer_id: customer.id,
          created_by: adminId,
          total_amount: '46501.50', // 2×12000 + 3×7500.50
          items_count: 2,
          customer: { id: customer.id, customer_name: customer.customerName },
          user: { id: adminId },
          items: [
            { product_id: hydro.id, quantity: 2, unit_price: '12000.00', subtotal: '24000.00' },
            { product_id: kopi.id, quantity: 3, unit_price: '7500.50', subtotal: '22501.50' },
          ],
        },
      });
      expect(await stockOf(hydro.id)).toBe(8);
      expect(await stockOf(kopi.id)).toBe(2);

      const second = await postOrder({
        customer_id: customer.id,
        items: [{ product_id: hydro.id, quantity: 1 }],
      }).expect(201);
      expect(second.body.data.order_number).toBe(`INV-${today}-0002`);
    });

    it('stok tidak cukup → 409 per item, dan TIDAK ADA stok yang berkurang (atomik)', async () => {
      const customer = await createCustomer(ctx.prisma);
      const enough = await createProduct(ctx.prisma, { stock: 10 });
      const scarce = await createProduct(ctx.prisma, { productName: 'Hydrococo 150ml', stock: 3 });

      const res = await postOrder({
        customer_id: customer.id,
        items: [
          { product_id: enough.id, quantity: 2 },
          { product_id: scarce.id, quantity: 5 },
        ],
      }).expect(409);

      expect(res.body).toEqual({
        success: false,
        message: 'Stok tidak mencukupi',
        errors: { 'items.1.quantity': ['Stok Hydrococo 150ml tersisa 3, diminta 5'] },
      });
      // Item pertama sempat dipotong di dalam transaksi, lalu di-rollback.
      expect(await stockOf(enough.id)).toBe(10);
      expect(await stockOf(scarce.id)).toBe(3);
      expect(await ctx.prisma.order.count()).toBe(0);
      expect(await ctx.prisma.orderItem.count()).toBe(0);
      // Counter nomor order ikut di-rollback → order sukses berikutnya tetap 0001.
      expect(await ctx.prisma.orderCounter.count()).toBe(0);
    });

    it('validasi input gagal → 422 dengan errors per field', async () => {
      const customer = await createCustomer(ctx.prisma);
      const product = await createProduct(ctx.prisma);

      const empty = await postOrder({ customer_id: 'bukan-uuid', items: [] }).expect(422);
      expect(empty.body.errors).toEqual({
        customer_id: ['Pilih pelanggan terlebih dahulu'],
        items: ['Pesanan harus berisi minimal satu produk'],
      });

      const badQty = await postOrder({
        customer_id: customer.id,
        items: [{ product_id: product.id, quantity: 0 }],
      }).expect(422);
      expect(badQty.body.errors).toEqual({ 'items.0.quantity': ['Jumlah minimal 1'] });

      const duplicate = await postOrder({
        customer_id: customer.id,
        items: [
          { product_id: product.id, quantity: 1 },
          { product_id: product.id, quantity: 1 },
        ],
      }).expect(422);
      expect(duplicate.body.errors).toHaveProperty(['items.1.product_id']);
    });

    it('harga / total dari client ditolak (dihitung server)', async () => {
      const customer = await createCustomer(ctx.prisma);
      const product = await createProduct(ctx.prisma, { price: 12000 });

      const res = await postOrder({
        customer_id: customer.id,
        total_amount: 1,
        items: [{ product_id: product.id, quantity: 1, price: 1 }],
      }).expect(422);

      expect(Object.keys(res.body.errors).sort()).toEqual(['items.0.price', 'total_amount']);
    });

    it('produk diarsipkan / pelanggan dihapus → 422 pada field terkait', async () => {
      const customer = await createCustomer(ctx.prisma);
      const archived = await createProduct(ctx.prisma);
      await ctx.prisma.product.update({ where: { id: archived.id }, data: { deletedAt: new Date() } });

      const productRes = await postOrder({
        customer_id: customer.id,
        items: [{ product_id: archived.id, quantity: 1 }],
      }).expect(422);
      expect(productRes.body.errors).toEqual({
        'items.0.product_id': ['Produk tidak ditemukan atau sudah diarsipkan'],
      });

      const active = await createProduct(ctx.prisma);
      await ctx.prisma.customer.update({ where: { id: customer.id }, data: { deletedAt: new Date() } });
      const customerRes = await postOrder({
        customer_id: customer.id,
        items: [{ product_id: active.id, quantity: 1 }],
      }).expect(422);
      expect(customerRes.body.errors).toEqual({ customer_id: ['Pelanggan tidak ditemukan'] });
    });

    it('tanpa token → 401 dan stok tidak berubah', async () => {
      const customer = await createCustomer(ctx.prisma);
      const product = await createProduct(ctx.prisma, { stock: 5 });

      await http()
        .post('/api/orders')
        .send({ customer_id: customer.id, items: [{ product_id: product.id, quantity: 1 }] })
        .expect(401);
      expect(await stockOf(product.id)).toBe(5);
    });

    it('race condition: 5 order bersamaan berebut stok 2 → tepat 2 sukses, stok 0', async () => {
      const customer = await createCustomer(ctx.prisma);
      const product = await createProduct(ctx.prisma, { stock: 2 });

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          postOrder({ customer_id: customer.id, items: [{ product_id: product.id, quantity: 1 }] }),
        ),
      );

      const statuses = results.map((r) => r.status).sort((a, b) => a - b);
      expect(statuses).toEqual([201, 201, 409, 409, 409]);
      expect(await stockOf(product.id)).toBe(0);
      const numbers = results.filter((r) => r.status === 201).map((r) => r.body.data.order_number);
      expect(new Set(numbers).size).toBe(2);
    });
  });

  describe('GET /api/orders & /api/orders/:id', () => {
    it('detail tetap utuh setelah harga berubah dan produk diarsipkan (snapshot harga)', async () => {
      const customer = await createCustomer(ctx.prisma);
      const product = await createProduct(ctx.prisma, { productName: 'Teh Botol', price: 5000 });
      const created = await postOrder({
        customer_id: customer.id,
        items: [{ product_id: product.id, quantity: 2 }],
      }).expect(201);

      await ctx.prisma.product.update({
        where: { id: product.id },
        data: { price: 9000, deletedAt: new Date() },
      });
      await ctx.prisma.customer.update({ where: { id: customer.id }, data: { deletedAt: new Date() } });

      const res = await get(`/api/orders/${created.body.data.id}`).expect(200);
      expect(res.body.data).toMatchObject({
        total_amount: '10000.00',
        customer: { customer_name: customer.customerName },
        items: [
          { unit_price: '5000.00', subtotal: '10000.00', product: { product_name: 'Teh Botol' } },
        ],
      });
    });

    it('list → filter tanggal WIB inklusif & customer, urut terbaru, tanpa items', async () => {
      const budi = await createCustomer(ctx.prisma, { customerName: 'Budi' });
      const siti = await createCustomer(ctx.prisma, { customerName: 'Siti' });
      const make = (number: string, customerId: string, orderDate: string) =>
        ctx.prisma.order.create({
          data: { orderNumber: number, customerId, createdBy: adminId, orderDate: new Date(orderDate), totalAmount: 1000 },
        });
      await make('INV-A', budi.id, '2026-10-09T16:59:00Z'); // 9 Okt 23:59 WIB
      await make('INV-B', budi.id, '2026-10-09T17:00:00Z'); // 10 Okt 00:00 WIB
      await make('INV-C', siti.id, '2026-10-12T16:59:59Z'); // 12 Okt 23:59 WIB
      await make('INV-D', siti.id, '2026-10-12T17:00:00Z'); // 13 Okt 00:00 WIB

      const byDate = await get('/api/orders?from=2026-10-10&to=2026-10-12').expect(200);
      expect(byDate.body.data.map((o: { order_number: string }) => o.order_number)).toEqual(['INV-C', 'INV-B']);
      expect(byDate.body.data[0]).not.toHaveProperty('items');
      expect(byDate.body.data[0]).toMatchObject({ items_count: 0, customer: { customer_name: 'Siti' } });

      const byCustomer = await get(`/api/orders?customer_id=${budi.id}`).expect(200);
      expect(byCustomer.body.meta.total).toBe(2);

      const invalid = await get('/api/orders?from=2026-10-12&to=2026-10-01').expect(422);
      expect(invalid.body.errors).toHaveProperty('to');
    });

    it('order tidak ada → 404', async () => {
      const res = await get('/api/orders/999').expect(404);
      expect(res.body).toEqual({ success: false, message: 'Pesanan tidak ditemukan' });
    });
  });
});
