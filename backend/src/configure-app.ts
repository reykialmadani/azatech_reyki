import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { createValidationPipe } from './common/pipes/validation.pipe.js';
import type { Env } from './config/env.validation.js';

/**
 * Konfigurasi HTTP global. Dipakai oleh main.ts DAN e2e test agar test
 * menguji perilaku yang sama persis dengan produksi.
 */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService<Env, true>);
  const origins = config
    .get('FRONTEND_URL', { infer: true })
    .split(',')
    .map((origin) => origin.trim());

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();
  return app;
}
