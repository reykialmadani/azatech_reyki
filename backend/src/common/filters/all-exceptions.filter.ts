import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';
import type { FieldErrors } from '../exceptions/api.exception.js';

interface ErrorBody {
  success: false;
  message: string;
  errors?: FieldErrors;
}

// Pesan default berbahasa Indonesia untuk error bawaan Nest/Passport.
const DEFAULT_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.UNAUTHORIZED]: 'Sesi tidak valid atau telah berakhir',
  [HttpStatus.FORBIDDEN]: 'Anda tidak memiliki akses',
  [HttpStatus.NOT_FOUND]: 'Resource tidak ditemukan',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Terlalu banyak permintaan, coba lagi nanti',
};

const NEST_DEFAULT_MESSAGES = new Set([
  'Unauthorized',
  'Forbidden',
  'Forbidden resource',
  'Not Found',
  'ThrottlerException: Too Many Requests',
]);

/** Semua error → envelope `{ success: false, message, errors? }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const [status, body] = this.toResponse(exception);

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }
    res.status(status).json(body);
  }

  private toResponse(exception: unknown): [number, ErrorBody] {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const { message, errors } =
        typeof response === 'object' && response !== null
          ? (response as { message?: unknown; errors?: FieldErrors })
          : { message: response, errors: undefined };

      // Pesan bawaan Nest/Passport (bahasa Inggris) diganti agar konsisten.
      const isCustom =
        typeof message === 'string' &&
        !NEST_DEFAULT_MESSAGES.has(message) &&
        !message.startsWith('Cannot ');
      return [
        status,
        {
          success: false,
          message: isCustom
            ? message
            : (DEFAULT_MESSAGES[status] ?? exception.message),
          ...(errors ? { errors } : {}),
        },
      ];
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }

    return [
      HttpStatus.INTERNAL_SERVER_ERROR,
      { success: false, message: 'Terjadi kesalahan pada server' },
    ];
  }

  // Jaring pengaman jika constraint DB dilanggar tanpa dicek di service.
  private fromPrisma(
    error: Prisma.PrismaClientKnownRequestError,
  ): [number, ErrorBody] {
    switch (error.code) {
      case 'P2002':
        return [HttpStatus.CONFLICT, { success: false, message: 'Data sudah ada (duplikat)' }];
      case 'P2003':
        return [HttpStatus.CONFLICT, { success: false, message: 'Data masih direferensikan data lain' }];
      case 'P2025':
        return [HttpStatus.NOT_FOUND, { success: false, message: 'Data tidak ditemukan' }];
      default:
        this.logger.error(`${error.code}: ${error.message}`);
        return [
          HttpStatus.INTERNAL_SERVER_ERROR,
          { success: false, message: 'Terjadi kesalahan pada server' },
        ];
    }
  }
}
