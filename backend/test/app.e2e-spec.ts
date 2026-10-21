import request from 'supertest';
import { createTestApp, type TestContext } from './helpers/test-app.js';

describe('Fondasi API (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/health → 200 dengan envelope standar', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body).toEqual({
      success: true,
      message: 'OK',
      data: { status: 'ok', database: 'up' },
    });
  });

  it('route tidak dikenal → 404 dengan envelope error', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/tidak-ada').expect(404);

    expect(res.body).toEqual({ success: false, message: 'Resource tidak ditemukan' });
  });
});
