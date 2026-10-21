import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/configure-app.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
}

/** Aplikasi Nest dengan konfigurasi global yang sama persis dengan main.ts. */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(moduleRef.createNestApplication({ logger: ['error'] }));
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Kosongkan semua tabel & reset sequence id agar tiap test independen. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE order_items, orders, order_counters, products, customers, sessions, users RESTART IDENTITY CASCADE',
  );
}
