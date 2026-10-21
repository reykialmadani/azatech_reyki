import { execSync } from 'node:child_process';
import pg from 'pg';

/**
 * Sekali sebelum seluruh e2e test: pastikan database test ada, lalu
 * jalankan migrasi. DATABASE_URL berasal dari .env.test (via dotenv-cli).
 */
export default async function globalSetup(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL untuk test belum di-set (.env.test)');

  const target = new URL(url);
  const dbName = target.pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(`Menolak menjalankan test di database non-test: ${dbName}`);
  }

  const admin = new URL(url);
  admin.pathname = '/postgres';
  admin.search = '';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
  }
  await client.end();

  execSync('pnpm prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
