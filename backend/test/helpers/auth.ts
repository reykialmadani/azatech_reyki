import type { INestApplication } from '@nestjs/common';
import * as argon2 from 'argon2';
import request from 'supertest';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

export const TEST_ADMIN = {
  name: 'Admin Test',
  email: 'admin@azatech.id',
  password: 'Admin123!',
};

export async function createAdmin(prisma: PrismaService) {
  return prisma.user.create({
    data: {
      name: TEST_ADMIN.name,
      email: TEST_ADMIN.email,
      password: await argon2.hash(TEST_ADMIN.password),
    },
  });
}

export interface LoginTokens {
  access_token: string;
  refresh_token: string;
}

export async function login(app: INestApplication): Promise<LoginTokens> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
    .expect(200);
  return res.body.data as LoginTokens;
}
