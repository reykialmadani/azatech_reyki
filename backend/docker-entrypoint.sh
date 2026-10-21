#!/bin/sh
# Dijalankan setiap container backend start.
set -e

echo "[entrypoint] menjalankan migrasi database..."
./node_modules/.bin/prisma migrate deploy

# Seeder idempoten (aman diulang): order hanya dibuat jika tabel orders kosong.
if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] menjalankan seeder..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "[entrypoint] menjalankan API di port ${PORT:-4000}"
exec node dist/main.js
