import request from 'supertest';
import { toJakartaIsoDate } from '../src/common/utils/jakarta-date.js';
import { createAdmin, login } from './helpers/auth.js';
import { createCustomer, createProduct } from './helpers/factories.js';
import { createTestApp, resetDatabase, type TestContext } from './helpers/test-app.js';

describe('Dashboard (e2e)', () => {
  let ctx: TestContext;
  let token: string;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await createAdmin(ctx.prisma);
    ({ access_token: token } = await login(ctx.app));
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('DB kosong → nol, tetapi daily_sales tetap 30 hari', async () => {
    const res = await http().get('/api/dashboard/summary').set(auth()).expect(200);

    expect(res.body.data).toMatchObject({
      total_sales: '0.00',
      total_transactions: 0,
      active_products: 0,
      low_stock_count: 0,
      top_products: [],
      low_stock_products: [],
    });
    expect(res.body.data.daily_sales).toHaveLength(30);
    expect(res.body.data.daily_sales.at(-1)).toEqual({
      date: toJakartaIsoDate(new Date()),
      total_amount: '0.00',
      transactions: 0,
    });
  });

  it('agregasi ringkasan, terlaris (termasuk produk diarsipkan), dan stok menipis', async () => {
    const customer = await createCustomer(ctx.prisma);
    const teh = await createProduct(ctx.prisma, { productName: 'Teh', price: 5000, stock: 20 });
    const kopi = await createProduct(ctx.prisma, { productName: 'Kopi', price: 10000, stock: 6 });
    await createProduct(ctx.prisma, { productName: 'Gula', stock: 4 });

    const order = (items: Array<[number, number]>) =>
      http()
        .post('/api/orders')
        .set(auth())
        .send({
          customer_id: customer.id,
          items: items.map(([product_id, quantity]) => ({ product_id, quantity })),
        })
        .expect(201);
    await order([[teh.id, 3], [kopi.id, 2]]); // 15000 + 20000
    await order([[teh.id, 4]]); // 20000
    await ctx.prisma.product.update({ where: { id: teh.id }, data: { deletedAt: new Date() } });

    const { body } = await http().get('/api/dashboard/summary').set(auth()).expect(200);
    const data = body.data;

    expect(data).toMatchObject({
      total_sales: '55000.00',
      total_transactions: 2,
      active_products: 2,
      low_stock_count: 2,
    });
    expect(data.top_products).toEqual([
      expect.objectContaining({ product_name: 'Teh', total_qty: 7, total_amount: '35000.00' }),
      expect.objectContaining({ product_name: 'Kopi', total_qty: 2, total_amount: '20000.00' }),
    ]);
    // Kopi: 6 - 2 = 4 → menipis; urut stok paling sedikit.
    expect(data.low_stock_products.map((p: { product_name: string; stock: number }) => [p.product_name, p.stock]))
      .toEqual([['Gula', 4], ['Kopi', 4]]);
    expect(data.daily_sales.at(-1)).toEqual({
      date: toJakartaIsoDate(new Date()),
      total_amount: '55000.00',
      transactions: 2,
    });
  });

  it('tanpa token → 401', async () => {
    await http().get('/api/dashboard/summary').expect(401);
  });
});
