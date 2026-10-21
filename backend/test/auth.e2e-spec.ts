import request from 'supertest';
import { createAdmin, login, TEST_ADMIN } from './helpers/auth.js';
import { createTestApp, resetDatabase, type TestContext } from './helpers/test-app.js';

describe('Auth (e2e)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    await createAdmin(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('POST /api/auth/login', () => {
    it('sukses → access + refresh token dan profil tanpa password', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: '  ADMIN@azatech.id ', password: TEST_ADMIN.password })
        .expect(200);

      expect(res.body).toMatchObject({
        success: true,
        message: 'Login berhasil',
        data: {
          token_type: 'Bearer',
          expires_in: 900,
          user: { name: TEST_ADMIN.name, email: TEST_ADMIN.email },
        },
      });
      expect(res.body.data.access_token).toEqual(expect.any(String));
      expect(res.body.data.refresh_token).toEqual(expect.any(String));
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('password salah → 401 dengan pesan generik', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: TEST_ADMIN.email, password: 'salah-total' })
        .expect(401);

      expect(res.body).toEqual({ success: false, message: 'Email atau password salah' });
    });

    it('validasi input gagal → 422 dengan errors per field', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: 'bukan-email', password: '', role: 'admin' })
        .expect(422);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toMatchObject({
        email: ['Format email tidak valid'],
        password: ['Password wajib diisi'],
        role: [expect.stringContaining('should not exist')],
      });
    });
  });

  describe('akses endpoint terproteksi', () => {
    it('tanpa token → 401', async () => {
      const res = await http().get('/api/auth/me').expect(401);
      expect(res.body).toEqual({
        success: false,
        message: 'Token autentikasi tidak ditemukan',
      });
    });

    it('token palsu → 401', async () => {
      await http().get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi').expect(401);
    });

    it('token valid → GET /me mengembalikan profil', async () => {
      const { access_token } = await login(ctx.app);
      const res = await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(res.body.data).toEqual({
        id: expect.any(String),
        name: TEST_ADMIN.name,
        email: TEST_ADMIN.email,
      });
    });
  });

  describe('refresh & logout', () => {
    it('refresh merotasi token; refresh token lama yang dipakai ulang me-revoke sesi', async () => {
      const first = await login(ctx.app);

      const refreshed = await http()
        .post('/api/auth/refresh')
        .send({ refresh_token: first.refresh_token })
        .expect(200);
      const second = refreshed.body.data as typeof first;
      expect(second.refresh_token).not.toBe(first.refresh_token);

      // Token lama dipakai lagi → dianggap dicuri → sesi di-revoke.
      await http().post('/api/auth/refresh').send({ refresh_token: first.refresh_token }).expect(401);
      await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${second.access_token}`)
        .expect(401);
    });

    it('logout → 204 dan access token langsung tidak berlaku', async () => {
      const { access_token, refresh_token } = await login(ctx.app);
      const auth = { Authorization: `Bearer ${access_token}` };

      await http().post('/api/auth/logout').set(auth).expect(204);

      await http().get('/api/auth/me').set(auth).expect(401);
      await http().post('/api/auth/refresh').send({ refresh_token }).expect(401);
    });
  });
});
