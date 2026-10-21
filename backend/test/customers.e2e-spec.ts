import request from 'supertest';
import { createAdmin, login } from './helpers/auth.js';
import { createCustomer } from './helpers/factories.js';
import { createTestApp, resetDatabase, type TestContext } from './helpers/test-app.js';

describe('Customers (e2e)', () => {
  let ctx: TestContext;
  let token: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(ctx.app.getHttpServer());

  const validPayload = {
    customer_name: ' Budi Santoso ',
    customer_address: 'Jakarta',
    gender: 'Pria',
    birth_date: '1995-02-10',
    phone: '',
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

  it('POST → 201, birth_date YYYY-MM-DD dan phone kosong menjadi null', async () => {
    const res = await http().post('/api/customers').set(auth()).send(validPayload).expect(201);

    expect(res.body.data).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      customer_name: 'Budi Santoso',
      gender: 'Pria',
      birth_date: '1995-02-10',
      phone: null,
    });
  });

  it('POST input tidak valid → 422 (gender, tanggal mustahil / masa depan, HP)', async () => {
    const res = await http()
      .post('/api/customers')
      .set(auth())
      .send({ ...validPayload, gender: 'L', birth_date: '2099-01-01', phone: '12345' })
      .expect(422);
    expect(Object.keys(res.body.errors).sort()).toEqual(['birth_date', 'gender', 'phone']);

    const impossible = await http()
      .post('/api/customers')
      .set(auth())
      .send({ ...validPayload, birth_date: '1995-02-30' })
      .expect(422);
    expect(impossible.body.errors).toHaveProperty('birth_date');
  });

  it('GET list → search nama (case-insensitive) & nomor HP', async () => {
    await createCustomer(ctx.prisma, { customerName: 'Budi Santoso', phone: '081111111111' });
    await createCustomer(ctx.prisma, { customerName: 'Siti Aminah', phone: '082222222222' });

    const byName = await http().get('/api/customers?search=BUDI').set(auth()).expect(200);
    expect(byName.body.data.map((c: { customer_name: string }) => c.customer_name)).toEqual(['Budi Santoso']);

    const byPhone = await http().get('/api/customers?search=0822').set(auth()).expect(200);
    expect(byPhone.body.data.map((c: { customer_name: string }) => c.customer_name)).toEqual(['Siti Aminah']);
    expect(byPhone.body.meta).toEqual({ page: 1, per_page: 10, total: 1, total_pages: 1 });
  });

  it('PUT → 200, DELETE → 204 lalu 404', async () => {
    const customer = await createCustomer(ctx.prisma);

    const updated = await http()
      .put(`/api/customers/${customer.id}`)
      .set(auth())
      .send({ ...validPayload, customer_name: 'Nama Baru', phone: '081234567890' })
      .expect(200);
    expect(updated.body.data).toMatchObject({ customer_name: 'Nama Baru', phone: '081234567890' });

    await http().delete(`/api/customers/${customer.id}`).set(auth()).expect(204);
    await http().get(`/api/customers/${customer.id}`).set(auth()).expect(404);
  });

  it('id bukan UUID → 404', async () => {
    const res = await http().get('/api/customers/123').set(auth()).expect(404);
    expect(res.body).toEqual({ success: false, message: 'Pelanggan tidak ditemukan' });
  });
});
