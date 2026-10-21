# Azatech Online Shop — Order Management

[![CI](https://github.com/reykialmadani/azatech_reyki/actions/workflows/ci.yml/badge.svg)](https://github.com/reykialmadani/azatech_reyki/actions/workflows/ci.yml)

Technical test **Medior Fullstack Developer — Track A (TypeScript)**. Aplikasi untuk mengelola produk, pelanggan, dan transaksi penjualan; satu order dapat berisi banyak produk, stok dipotong secara atomik, dan harga selalu dihitung di server.

| Service | Folder | Stack | URL (Docker) |
|---|---|---|---|
| Frontend | [`frontend/`](frontend) | Next.js 16 (App Router) · React 19 · TanStack Query · Tailwind + shadcn/ui | http://localhost:3000 |
| Backend (REST API) | [`backend/`](backend) | Node.js 24 · NestJS 12 · Prisma 7 · PostgreSQL 17 · JWT | http://localhost:4000/api |
| Dokumentasi API | — | Swagger UI · OpenAPI · Postman | http://localhost:4000/api/docs |

**Daftar isi:** [Quick start](#quick-start-docker) · [Tech stack](#tech-stack--alasan) · [Logika order & stok](#logika-pembuatan-order--penanganan-stok) · [Database](#desain-database) · [API](#api) · [Testing](#testing) · [Asumsi & keterbatasan](#asumsi-keterbatasan--rencana-perbaikan) · [AI Usage](#ai-usage)

---

## Quick start (Docker)

Prasyarat: Docker Desktop / Docker Engine + Compose v2.

```bash
git clone https://github.com/reykialmadani/azatech_reyki.git
cd azatech_reyki
cp .env.example .env
docker compose up -d --build
```

Build pertama ±5–10 menit (unduh dependency). Saat container backend start, **migrasi dan seeder berjalan otomatis**; frontend baru dinyalakan setelah backend `healthy`.

| | |
|---|---|
| Aplikasi | http://localhost:3000 |
| Login (seeder) | **`admin@azatech.id`** / **`Admin123!`** |
| Swagger UI | http://localhost:4000/api/docs |
| Health check | http://localhost:4000/api/health |

Data seeder: 1 admin, 22 produk (bergambar), 15 pelanggan, 30 order tersebar dalam 30 hari terakhir. Seeder idempoten — restart container tidak menggandakan data. Reset total: `docker compose down -v && docker compose up -d`.

> Port bentrok? Ubah `POSTGRES_PORT` / `BACKEND_PORT` / `FRONTEND_PORT` di `.env`. Jika port frontend/backend diubah, sesuaikan juga `FRONTEND_URL` dan `NEXT_PUBLIC_API_URL`.

### Development lokal (tanpa container aplikasi)

```bash
docker compose up -d db                       # hanya PostgreSQL
cd backend  && cp .env.example .env && pnpm install && pnpm db:deploy && pnpm db:seed && pnpm start:dev
cd frontend && cp .env.example .env.local && pnpm install && pnpm dev
```

Frontend juga bisa berjalan **tanpa backend** dengan mock API in-memory: set `NEXT_PUBLIC_USE_MOCK=true` di `frontend/.env.local`.

---

## Tech stack & alasan

| Pilihan | Alasan |
|---|---|
| **NestJS** | Struktur modul + DI memaksa *separation of concerns* (controller tipis → service → Prisma); guard, pipe, filter, interceptor global membuat aturan lintas-endpoint (auth, validasi, format response) cukup ditulis sekali. |
| **Prisma 7 + PostgreSQL** | Skema tipe-aman sebagai satu sumber kebenaran, migrasi SQL yang bisa dibaca, interactive transaction untuk order. PostgreSQL: `numeric` presisi untuk uang, CHECK constraint, `ON CONFLICT` untuk counter nomor order. |
| **JWT access + refresh token** | Sesuai soal Track A. Refresh token dirotasi & disimpan sebagai hash di tabel `sessions` sehingga logout benar-benar me-revoke token. |
| **class-validator** | Terintegrasi native dengan `ValidationPipe` NestJS; error diratakan ke kunci dot-notation (`items.0.quantity`) yang langsung dipetakan ke field form di frontend. |
| **Vitest + Supertest** | Default scaffold NestJS 12, cepat; e2e berjalan terhadap PostgreSQL sungguhan (bukan mock) karena yang diuji adalah atomisitas transaksi. |
| **Next.js + TanStack Query** | App Router + client components untuk dashboard interaktif; TanStack Query untuk cache, invalidasi setelah mutasi (stok & dashboard otomatis ter-update), dan state loading/error. |
| **pnpm, dua project terpisah** | Backend & frontend tidak berbagi kode; satu-satunya kontrak adalah HTTP API + OpenAPI. Masing-masing punya lockfile & Dockerfile sendiri. |

---

## Struktur repository

```
.
├── backend/                 NestJS API
│   ├── prisma/              schema.prisma, migrations/ (SQL), seed.ts
│   ├── src/
│   │   ├── common/          decorators, dto, exceptions, filters, interceptors, pipes, utils, validators
│   │   ├── config/          validasi env (fail-fast saat boot)
│   │   ├── auth/            login, refresh, logout, me, JwtAuthGuard global
│   │   ├── products/  customers/  orders/  dashboard/  health/
│   │   ├── configure-app.ts konfigurasi global — dipakai main.ts DAN e2e test
│   │   └── main.ts
│   ├── test/                e2e (Vitest + Supertest) + helpers
│   └── docs/                openapi.json, Postman collection
├── frontend/                Next.js app (lihat frontend/README.md)
├── .github/workflows/ci.yml lint + test + build + docker build
├── docker-compose.yml       db + backend + frontend
└── .env.example             variabel compose
```

**Aturan layering backend:** Controller hanya mengurus HTTP (param, DTO, status code) → Service berisi logika bisnis → `PrismaService` untuk data. Mapper per modul mengubah model Prisma (camelCase) menjadi kontrak API (snake_case).

---

## Logika pembuatan order & penanganan stok

Inti aplikasi ada di [`backend/src/orders/orders.service.ts`](backend/src/orders/orders.service.ts).

```
POST /api/orders { customer_id, items: [{ product_id, quantity }] }

1. JwtAuthGuard (global)        → 401 tanpa token / sesi sudah logout
2. ValidationPipe + DTO         → 422: customer_id UUID, items ≥ 1, quantity int ≥ 1,
                                   field asing (price, total_amount) DITOLAK
3. Cek product_id duplikat      → 422 items.N.product_id
4. prisma.$transaction(async tx => {
     a. pelanggan ada & belum di-soft-delete         → 422 customer_id
     b. semua produk ada & aktif                     → 422 items.N.product_id
     c. per item, urut product_id:
          UPDATE products SET stock = stock - qty
          WHERE id = ? AND deleted_at IS NULL AND stock >= qty
        0 baris ter-update = stok kurang; SEMUA item dicek dulu
                                                     → 409 { "items.N.quantity": ["Stok X tersisa 3, diminta 5"] }
     d. unit_price = harga produk di DB (snapshot); subtotal = unit_price × qty;
        total = Σ subtotal  (Decimal, bukan float)
     e. order_number = INV-YYYYMMDD-XXXX via upsert order_counters (tanggal WIB)
     f. insert orders + order_items
   })
5. Error di langkah mana pun → ROLLBACK: stok, counter nomor, order, item kembali seperti semula
6. 201 + detail order (format sama dengan GET /api/orders/:id)
```

Keputusan penting:

- **Race condition stok.** Cek dan potong stok dilakukan dalam *satu* statement `UPDATE … WHERE stock >= qty`, bukan baca-lalu-tulis. Saat dua transaksi berebut baris yang sama, PostgreSQL mengunci baris dan mengevaluasi ulang `WHERE` setelah transaksi pertama commit, sehingga stok terakhir tidak bisa terjual dua kali. Dibuktikan oleh test: 5 order bersamaan untuk stok 2 → tepat 2 sukses, 3 mendapat 409, stok akhir 0. `CHECK (stock >= 0)` di database menjadi pengaman terakhir.
- **Anti deadlock.** Item diproses urut `product_id`, sehingga dua order dengan produk `[A,B]` dan `[B,A]` mengunci baris dalam urutan yang sama.
- **Error per item.** Semua item dicek sebelum transaksi dibatalkan, sehingga form kasir dapat menandai *setiap* baris yang stoknya kurang sekaligus.
- **Nomor order.** `INSERT … ON CONFLICT DO UPDATE` pada `order_counters(date)` atomik dan ikut transaksi: tidak ada nomor ganda saat konkuren, dan order yang gagal tidak menyisakan nomor bolong. Trade-off: baris counter harian terkunci sampai transaksi selesai (order di hari yang sama diserialkan) — wajar untuk skala toko; alternatifnya sequence DB jika butuh throughput lebih tinggi.
- **Zona waktu.** Tanggal di nomor order, filter `from`/`to` (inklusif), dan grafik harian memakai hari kalender **Asia/Jakarta**; database menyimpan timestamp dalam UTC.
- **Soft delete.** Produk/pelanggan yang dihapus hilang dari list & tidak bisa dipesan, tetapi riwayat order tetap menampilkan nama dan harga saat transaksi (query detail order tidak memfilter `deleted_at`).

---

## Desain database

```
users 1──< sessions
users 1──< orders >──1 customers
              1
              │
              ^
         order_items >──1 products
order_counters (date PK → last_seq)        generator nomor order harian
```

Tambahan terhadap struktur minimum soal, beserta alasannya:

| Tambahan | Alasan |
|---|---|
| `products.image_url` (varchar 500, nullable) | Thumbnail produk di tabel, kasir, dan dashboard. Opsional; frontend menampilkan ikon fallback. |
| Tabel `sessions` | Satu login = satu sesi. Menyimpan **hash SHA-256** refresh token aktif → rotasi, deteksi pemakaian ulang token, dan logout yang me-revoke access token yang belum kedaluwarsa. |
| Tabel `order_counters` | Penomoran `INV-YYYYMMDD-XXXX` yang aman konkuren dan ikut rollback. |
| CHECK constraint | `stock >= 0`, `price > 0`, `quantity > 0`, `unit_price > 0`, `subtotal >= 0`, `total_amount >= 0` — aturan bisnis dijaga juga di level DB ([migrasi](backend/prisma/migrations)). |
| Index | `products(product_name)`, `customers(customer_name)` untuk sort/search; `orders(order_date)`, `orders(customer_id)` untuk filter riwayat; `order_items(order_id)`, `order_items(product_id)` untuk join & agregasi terlaris; `sessions(user_id)`. Unique: `users.email`, `products.product_code`, `orders.order_number`. |
| `id` produk/order/item `INTEGER` (bukan `BIGINT`) | `BigInt` tidak bisa di-serialize JSON tanpa workaround; kapasitas ±2,1 miliar baris lebih dari cukup. `users.id` & `customers.id` UUID. |
| Uang `DECIMAL(12,2)` / `DECIMAL(14,2)` | Tidak ada pembulatan float. Di JSON dikirim sebagai string 2 desimal (`"12000.00"`) agar presisi tidak hilang. |

---

## API

Semua endpoint ber-prefix `/api` dan wajib `Authorization: Bearer <access_token>` kecuali yang ditandai *public*.

| Endpoint | Method | Keterangan |
|---|---|---|
| `/auth/login` | POST | *public* · rate limit 5/menit · `{ access_token, refresh_token, token_type, expires_in, user }` |
| `/auth/refresh` | POST | *public* · tukar refresh token (rotasi) |
| `/auth/logout` | POST | 204 · revoke sesi |
| `/auth/me` | GET | profil user |
| `/products` | GET · POST | `?page, per_page, search, sort=product_name\|price\|stock:asc\|desc` |
| `/products/{id}` | GET · PUT · DELETE | DELETE = soft delete (204) |
| `/customers` | GET · POST | `?page, per_page, search` (nama / no. HP) |
| `/customers/{id}` | GET · PUT · DELETE | DELETE = soft delete (204) |
| `/orders` | GET · POST | `?page, per_page, from, to (YYYY-MM-DD, WIB, inklusif), customer_id` |
| `/orders/{id}` | GET | detail + item |
| `/dashboard/summary` | GET | total transaksi & penjualan, 5 terlaris, stok < 5, penjualan harian 30 hari |
| `/health` | GET | *public* · status API + database |

**Format response**

```jsonc
// sukses (list)
{ "success": true, "message": "OK", "data": [ … ], "meta": { "page": 1, "per_page": 10, "total": 57, "total_pages": 6 } }
// error
{ "success": false, "message": "Stok tidak mencukupi", "errors": { "items.1.quantity": ["Stok Hydrococo 150ml tersisa 3, diminta 5"] } }
```

Status code: `200` OK · `201` dibuat · `204` hapus/logout · `401` token tidak ada/invalid/sesi dicabut · `404` tidak ditemukan (termasuk id dengan format mustahil) · `409` kode produk duplikat / stok tidak cukup · `422` validasi · `429` rate limit · `500` error tak terduga (detail hanya di log).

**Dokumentasi:**
- Swagger UI interaktif: http://localhost:4000/api/docs (tombol *Authorize*), JSON: `/api/docs-json`
- OpenAPI: [`backend/docs/openapi.json`](backend/docs/openapi.json) (di-export otomatis saat `start:dev`)
- Postman: [`backend/docs/azatech-api.postman_collection.json`](backend/docs/azatech-api.postman_collection.json) — 25 request dengan test. Jalankan *Auth / Login* lebih dulu (token tersimpan otomatis). Collection dapat di-*Run* utuh (diverifikasi dengan Newman); beri jeda 1 menit antar run penuh karena rate limit login.

---

## Testing

| Perintah | Isi |
|---|---|
| `cd backend && pnpm test` | Unit test fungsi murni (tanggal WIB, perataan error validasi) |
| `cd backend && pnpm test:e2e` | **35 test e2e** terhadap PostgreSQL sungguhan |
| `cd frontend && pnpm test` | 12 test Vitest (format Rupiah/tanggal, alur order, filter riwayat, silent refresh token) |

E2E butuh PostgreSQL (`docker compose up -d db`) dan `backend/.env.test` (`cp .env.test.example .env.test`). Database `azatech_shop_test` dibuat & dimigrasi otomatis oleh `test/global-setup.ts` (menolak berjalan di database yang namanya tidak berakhiran `_test`); tiap test mengosongkan tabel sehingga independen.

Skenario wajib soal ✅ dan tambahan:

| Area | Skenario |
|---|---|
| Order | ✅ buat order sukses (total, snapshot harga, stok berkurang, nomor INV berurutan) · ✅ stok tidak cukup → 409 per item **dan tidak ada stok yang berkurang** + counter ikut rollback · ✅ validasi gagal → 422 · ✅ tanpa token → 401 · harga/total dari client ditolak · produk diarsip / pelanggan dihapus · **race condition 5 order konkuren** · detail tetap utuh setelah harga berubah & produk diarsip · filter tanggal WIB (batas 23:59/00:00) |
| Auth | login sukses/gagal, 422, token palsu, rotasi refresh + deteksi reuse, logout me-revoke access token |
| Products / Customers | CRUD, 409 kode duplikat (termasuk milik produk terarsip), search, sort, pagination, soft delete, id tidak valid → 404 |
| Dashboard | DB kosong, agregasi, terlaris termasuk produk terarsip, stok menipis, `daily_sales` 30 hari |

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): backend (build, lint, unit, e2e dengan service PostgreSQL), frontend (lint, typecheck, test, build), lalu `docker compose build`.

---

## Docker

- `backend/Dockerfile` multi-stage; `docker-entrypoint.sh` menjalankan `prisma migrate deploy`, seeder (jika `RUN_SEED=true`, idempoten), lalu API. Healthcheck memanggil `/api/health` yang juga mengecek koneksi DB.
- Urutan start dijamin `depends_on: condition: service_healthy`: db → backend → frontend.
- Kedua container aplikasi berjalan sebagai user non-root `node`.
- Secret JWT **wajib** dari `.env` (tanpa default di compose); compose berhenti dengan pesan jelas jika belum diisi.
- `NEXT_PUBLIC_API_URL` dibakukan saat build frontend dan harus alamat yang dijangkau **browser** (`localhost:4000`), bukan nama service internal.
- Trade-off: image backend (±1 GB) menyertakan devDependencies agar `prisma` CLI dan `tsx` (seeder) tersedia saat start. Perbaikan: stage/job migrasi terpisah sehingga image runtime hanya berisi dependency produksi.
- Build tahan koneksi lambat: cache mount store pnpm + `fetchRetries`/`fetchTimeout` di `pnpm-workspace.yaml`.

---

## Asumsi, keterbatasan & rencana perbaikan

**Asumsi**
- Satu peran pengguna (admin/kasir); semua endpoint selain login/refresh/health butuh login. Belum ada RBAC sehingga status `403` belum terpakai.
- Order bersifat final: belum ada edit/batal/retur order (akan butuh pengembalian stok dalam transaksi yang sama).
- Mata uang tunggal Rupiah, harga sudah termasuk pajak; "hari" mengikuti WIB.
- Stok < 5 dianggap menipis (konstanta sama di backend & frontend).
- Total transaksi & penjualan di dashboard dihitung sepanjang waktu; grafik harian 30 hari terakhir.

**Keterbatasan**
- Token disimpan di `localStorage` (sederhana untuk SPA, tetapi rentan XSS). Lebih aman: refresh token di cookie `httpOnly` + `SameSite`.
- Setiap request terautentikasi melakukan 1 lookup sesi ke DB (harga dari revoke yang instan); bisa di-cache (Redis) bila trafik tinggi.
- Rate limit disimpan in-memory per instance; untuk multi-instance perlu storage bersama (Redis).
- Search memakai `ILIKE '%…%'` yang tidak memakai index B-tree; untuk data besar gunakan `pg_trgm` (GIN) atau full-text search.
- Pagination offset; untuk riwayat order yang sangat besar lebih baik cursor-based.
- Snapshot harga dibaca tepat sebelum stok dikunci; perubahan harga pada milidetik yang sama tidak ikut terbaca (dapat diterima).

**Jika ada waktu lebih**
- Export riwayat order ke CSV/Excel, pembatalan order dengan pengembalian stok, audit log perubahan stok.
- Test E2E browser (Playwright) untuk alur kasir; test komponen frontend lebih banyak.
- Image backend produksi yang ramping (job migrasi terpisah), observability (request id, structured logging).

**Status bonus:** ✅ `docker compose up` · ✅ GitHub Actions (lint + test + build) · ✅ grafik penjualan harian di dashboard · ✅ test frontend (Vitest) · ⬜ export CSV/Excel.

---

## AI Usage

Kandidat bertanggung jawab atas seluruh kode dan dapat menjelaskan serta memodifikasinya.

| Tool | Dipakai untuk |
|---|---|
| **Claude Code** (Anthropic, model Claude Opus) | Backend: analisis soal & kontrak API frontend, implementasi bertahap per batch (fondasi, auth, products/customers, orders, dashboard + seeder), e2e test, Docker & compose, GitHub Actions, Postman collection, README. Setiap batch direview, diverifikasi (build, lint, test, smoke test), dan di-commit oleh kandidat. |
| <!-- TODO kandidat: tool yang dipakai untuk frontend --> | <!-- TODO kandidat: bagian frontend yang dibantu AI --> |
