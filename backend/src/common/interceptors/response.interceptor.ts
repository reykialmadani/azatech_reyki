import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';
import { Paginated, type PaginationMeta } from '../utils/pagination.js';

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

/** Membungkus hasil controller → `{ success, message, data, meta? }`. */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessBody<unknown> | undefined>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessBody<unknown> | undefined> {
    const message =
      this.reflector.get<string | undefined>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      'OK';
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((result) => {
        if (res.statusCode === HttpStatus.NO_CONTENT) return undefined;
        if (result instanceof Paginated) {
          return { success: true, message, data: result.data, meta: result.meta };
        }
        return { success: true, message, data: result ?? null };
      }),
    );
  }
}
