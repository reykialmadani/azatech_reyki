import request from 'supertest';
import { createAdmin, login } from './helpers/auth.js';
import { createProduct } from './helpers/factories.js';
import { createTestApp, resetDatabase, type TestContext } from './helpers/test-app.js';

describe('Products (e2e)', () => {
  let ctx: TestContext;
  let token: string;
  const api = () => {
    const agent = request(ctx.app.getHttpServer());
    const auth = { Authorization: `Bearer ${token}` };
    return {
      get: (url: string) => agent.get(url).set(auth),
      post: (url: string, body: object) => agent.post(url).set(auth).send(body),
      put: (url: string, body: object) => agent.put(url).set(auth).send(body),
      delete: (url: string) => agent.delete(url).set(auth),
    };
  };

  const validPayload = {
    product_code: 'p0001 ',
    product_name: ' Hydrococo 150ml ',
    image_url: '',
    price: 12000,
    stock: 10,
  };

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

  it('POST → 201, input dinormalisasi & harga berformat 2 desimal', async () => {
    const res = await api().post('/api/products', validPayload).expect(201);

    expect(res.body).toMatchObject({
      success: true,
      message: 'Produk berhasil dibuat',
      data: {
        id: 1,
        product_code: 'P0001',
        product_name: 'Hydrococo 150ml',
        image_url: null,
        price: '12000.00',
        stock: 10,
      },
    });
    expect(res.body.data).not.toHaveProperty('deleted_at');
  });

  it('POST input tidak valid → 422 dengan errors per field', async () => {
    const res = await api()
      .post('/api/products', { product_code: 'P 1', product_name: '', price: 0, stock: -1, image_url: 'ftp://x' })
      .expect(422);

    expect(Object.keys(res.body.errors).sort()).toEqual(
      ['image_url', 'price', 'product_code', 'product_name', 'stock'].sort(),
    );
    expect(res.body.errors.price).toContain('Harga harus lebih dari 0');
    expect(res.body.errors.stock).toContain('Stok tidak boleh negatif');
  });

  it('kode duplikat → 409, termasuk kode milik produk yang sudah dihapus', async () => {
    const archived = await createProduct(ctx.prisma, { productCode: 'P0001' });
    await api().delete(`/api/products/${archived.id}`).expect(204);

    const res = await api().post('/api/products', validPayload).expect(409);
    expect(res.body).toEqual({
      success: false,
      message: 'Kode produk sudah digunakan',
      errors: { product_code: ['Kode P0001 sudah digunakan'] },
    });
  });

  it('GET list → pagination, search nama/kode, dan sort', async () => {
    await createProduct(ctx.prisma, { productCode: 'A001', productName: 'Kopi Susu', price: 15000, stock: 3 });
    await createProduct(ctx.prisma, { productCode: 'B002', productName: 'Teh Manis', price: 8000, stock: 20 });
    await createProduct(ctx.prisma, { productCode: 'KOPI-3', productName: 'Air Mineral', price: 5000, stock: 7 });

    const page = await api().get('/api/products?page=2&per_page=2').expect(200);
    expect(page.body.meta).toEqual({ page: 2, per_page: 2, total: 3, total_pages: 2 });
    expect(page.body.data).toHaveLength(1);

    const search = await api().get('/api/products?search=kopi').expect(200);
    expect(search.body.data.map((p: { product_code: string }) => p.product_code).sort()).toEqual(['A001', 'KOPI-3']);

    const sorted = await api().get('/api/products?sort=price:desc').expect(200);
    expect(sorted.body.data.map((p: { price: string }) => p.price)).toEqual(['15000.00', '8000.00', '5000.00']);

    await api().get('/api/products?sort=harga:asc').expect(422);
    await api().get('/api/products?per_page=101').expect(422);
  });

  it('PUT → 200 memperbarui produk; boleh mempertahankan kodenya sendiri', async () => {
    const product = await createProduct(ctx.prisma, { productCode: 'P0001' });

    const res = await api()
      .put(`/api/products/${product.id}`, { ...validPayload, price: 13500.5, stock: 4 })
      .expect(200);
    expect(res.body.data).toMatchObject({ product_code: 'P0001', price: '13500.50', stock: 4 });
  });

  it('DELETE → 204 (soft delete), lalu produk hilang dari list & detail', async () => {
    const product = await createProduct(ctx.prisma);

    await api().delete(`/api/products/${product.id}`).expect(204);

    await api().get(`/api/products/${product.id}`).expect(404);
    await api().delete(`/api/products/${product.id}`).expect(404);
    const list = await api().get('/api/products').expect(200);
    expect(list.body.meta.total).toBe(0);
    // Baris masih ada di DB (dibutuhkan riwayat order).
    expect(await ctx.prisma.product.count()).toBe(1);
  });

  it('id tidak valid / tidak ada → 404', async () => {
    await api().get('/api/products/abc').expect(404);
    await api().get('/api/products/99999999999').expect(404);
    const res = await api().get('/api/products/999').expect(404);
    expect(res.body).toEqual({ success: false, message: 'Produk tidak ditemukan' });
  });
});
