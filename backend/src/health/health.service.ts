import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dipakai healthcheck Docker: sehat hanya jika database bisa dijangkau. */
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database tidak dapat dijangkau');
    }
    return { status: 'ok', database: 'up' };
  }
}
