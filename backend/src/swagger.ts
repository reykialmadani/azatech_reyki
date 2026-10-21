import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Swagger UI di /api/docs; saat development juga menulis docs/openapi.json. */
export async function setupSwagger(
  app: INestApplication,
  { exportFile }: { exportFile: boolean },
): Promise<void> {
  const config = new DocumentBuilder()
    .setTitle('Azatech Online Shop API')
    .setDescription(
      'REST API Order Management. Semua endpoint selain login/refresh membutuhkan Bearer token. ' +
        'Response sukses: `{ success, message, data, meta? }`; error: `{ success: false, message, errors? }`.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });

  if (exportFile) {
    const dir = join(process.cwd(), 'docs');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'openapi.json'), JSON.stringify(document, null, 2));
  }
}
