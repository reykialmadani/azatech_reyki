import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.validation.js';
import { configureApp } from './configure-app.js';
import { setupSwagger } from './swagger.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService<Env, true>);

  await setupSwagger(app, {
    exportFile: config.get('NODE_ENV', { infer: true }) === 'development',
  });
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
