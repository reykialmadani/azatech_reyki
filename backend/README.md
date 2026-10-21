# Backend — Azatech Online Shop API

NestJS 12 · TypeScript strict (ESM) · Prisma 7 (driver adapter `pg`) · PostgreSQL 17 · Vitest + Supertest · oxlint.

Gambaran umum, alur order, dan desain database ada di [README root](../README.md). Dokumen ini panduan developer backend.

## Setup lokal

```bash
docker compose up -d db          # dari root repo: PostgreSQL di localhost:5432
cp .env.example .env
cp .env.test.example .env.test
pnpm install
pnpm db:deploy                   # terapkan migrasi
pnpm db:seed                     # admin@azatech.id / Admin123!
pnpm start:dev                   # http://localhost:4000/api · Swagger: /api/docs
```

## Scripts

| Script | Fungsi |
|---|---|
| `start:dev` | Watch mode; menulis ulang `docs/openapi.json` saat `NODE_ENV=development` |
| `build` / `start:prod` | `prisma generate` + `nest build` → `node dist/main` |
| `lint` / `format` | oxlint (type-aware) / prettier |
| `test` | Unit test (`src/**/*.spec.ts`) |
| `test:e2e` | E2E terhadap DB `*_test` (dibuat & dimigrasi otomatis) |
| `db:migrate` | `prisma migrate dev` — buat migrasi baru dari perubahan schema |
| `db:deploy` | `prisma migrate deploy` — terapkan migrasi (dipakai Docker/CI) |
| `db:seed` | Seeder deterministik & idempoten |
| `db:reset` | Hapus semua data + migrasi ulang (lalu jalankan `db:seed`) |

## Environment

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Koneksi PostgreSQL |
| `FRONTEND_URL` | ✅ | Origin CORS yang diizinkan (boleh beberapa, dipisah koma) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | ✅ | Min. 16 karakter, harus berbeda |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | | Default `15m`, `7d` (format `<angka><s\|m\|h\|d>`) |
| `PORT`, `NODE_ENV` | | Default `4000`, `development` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | | Akun admin seeder |

Env divalidasi saat boot ([`src/config/env.validation.ts`](src/config/env.validation.ts)); server menolak start bila ada yang hilang/tidak valid.

## Struktur `src/`

```
common/
  decorators/    @Public(), @CurrentUser(), @ResponseMessage()
  dto/           PaginationQueryDto (page, per_page ≤ 100)
  exceptions/    ApiException — error dengan `errors` per field
  filters/       AllExceptionsFilter → { success:false, message, errors? }
  interceptors/  ResponseInterceptor → { success, message, data, meta? }
  pipes/         ValidationPipe 422 (dot-notation), IntIdPipe/UuidPipe (id mustahil → 404)
  transformers/  Trim, TrimUpper, TrimToNull
  utils/         pagination, jakarta-date (WIB), money ("12000.00"), duration, prisma-errors
  validators/    IsPastIsoDate, IsIsoDate
config/          validasi env
auth/            AuthService (argon2, JWT, sesi), JwtAuthGuard (APP_GUARD global)
products/ customers/ orders/ dashboard/ health/
  <modul>.controller.ts   HTTP saja
  <modul>.service.ts      logika bisnis
  <modul>.mapper.ts       Prisma (camelCase) → API (snake_case)
  dto/                    validasi input + dokumentasi Swagger (plugin @nestjs/swagger)
configure-app.ts  prefix, helmet, CORS, pipe/filter/interceptor global — dipakai main.ts & e2e
swagger.ts        Swagger UI + export docs/openapi.json
```

## Konvensi

- **Secure by default:** `JwtAuthGuard` global; route publik wajib ditandai `@Public()`.
- **Kontrak API snake_case**, uang sebagai string 2 desimal, `deleted_at` tidak pernah diekspos.
- **Validasi input** di DTO (`whitelist` + `forbidNonWhitelisted`: field asing → 422). Aturan yang butuh DB (kode unik, stok, relasi) di service.
- **Error bisnis** dengan field terkait memakai `ApiException(status, message, errors)` agar frontend bisa menandai input yang salah.
- Import memakai suffix `.js` (ESM `nodenext`). Prisma Client di-generate ke `src/generated/prisma` (gitignored; dibuat oleh `pnpm build` / `prisma generate`).

## Dokumentasi API

- Swagger UI: `/api/docs` · OpenAPI: [`docs/openapi.json`](docs/openapi.json)
- Postman: [`docs/azatech-api.postman_collection.json`](docs/azatech-api.postman_collection.json) — `newman run docs/azatech-api.postman_collection.json` (beri jeda 1 menit antar run penuh: rate limit login 5/menit)
