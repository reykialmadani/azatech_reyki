# Azatech Online Shop — Order Management

[![CI](https://github.com/reykialmadani/azatech_reyki/actions/workflows/ci.yml/badge.svg)](https://github.com/reykialmadani/azatech_reyki/actions/workflows/ci.yml)

Technical test **Medior Fullstack Developer — Track A (TypeScript)**. Aplikasi untuk mengelola produk, pelanggan, dan transaksi penjualan; satu order dapat berisi banyak produk, stok dipotong secara atomik, dan harga selalu dihitung di server.

| Service | Folder | Stack | URL (Docker) |
|---|---|---|---|
| Frontend | [`frontend/`](frontend) | Next.js 16 (App Router) · React 19 · TanStack Query · Tailwind + shadcn/ui | http://localhost:3000 |
| Backend (REST API) | [`backend/`](backend) | Node.js 24 · NestJS 12 · Prisma 7 · PostgreSQL 17 · JWT | http://localhost:4000/api |
| Dokumentasi API | — | Swagger UI · OpenAPI · Postman | http://localhost:4000/api/docs |

---

## Quick start (Docker)

Prasyarat: Docker Desktop / Docker Engine + Compose v2.

```bash
git clone https://github.com/reykialmadani/azatech_reyki.git
cd azatech_reyki
cp .env.example .env          # isi JWT_ACCESS_SECRET & JWT_REFRESH_SECRET
docker compose up -d --build
```

Build pertama ±5–10 menit. Migrasi dan seeder berjalan otomatis saat backend start.

- Aplikasi: http://localhost:3000 — login **`admin@azatech.id`** / **`Admin123!`**
- Seeder: 1 admin, 22 produk, 15 pelanggan, 30 order dalam 30 hari terakhir (idempoten).
- Reset data: `docker compose down -v && docker compose up -d`.
- Port bentrok? Ubah `POSTGRES_PORT` / `BACKEND_PORT` / `FRONTEND_PORT` di `.env`.

Development lokal tanpa container aplikasi:

```bash
docker compose up -d db
cd backend  && cp .env.example .env && pnpm install && pnpm db:deploy && pnpm db:seed && pnpm start:dev
cd frontend && cp .env.example .env.local && pnpm install && pnpm dev
```

---

## Tech stack & alasan

| Pilihan | Alasan |
|---|---|
| **NestJS** | Modul + DI memaksa *separation of concerns* (controller tipis → service → Prisma); guard, pipe, filter, interceptor global membuat aturan lintas-endpoint cukup ditulis sekali. |
| **Prisma 7 + PostgreSQL** | Skema tipe-aman, migrasi SQL yang bisa dibaca, interactive transaction untuk order. PostgreSQL: `numeric` untuk uang, CHECK constraint, `ON CONFLICT` untuk counter nomor order. |
| **JWT access + refresh token** | Refresh token dirotasi & disimpan sebagai hash di tabel `sessions`, sehingga logout benar-benar me-revoke token. |
| **Vitest + Supertest** | E2E berjalan terhadap PostgreSQL sungguhan (bukan mock) karena yang diuji adalah atomisitas transaksi. |
| **Next.js + TanStack Query** | Cache, invalidasi setelah mutasi (stok & dashboard otomatis ter-update), serta state loading/error. |

---

## Logika pembuatan order & penanganan stok

Inti ada di [`backend/src/orders/orders.service.ts`](backend/src/orders/orders.service.ts).

```
POST /api/orders { customer_id, items: [{ product_id, quantity }] }

1. JwtAuthGuard                 → 401 tanpa token / sesi sudah logout
2. ValidationPipe + DTO         → 422; field asing (price, total_amount) DITOLAK
3. prisma.$transaction(async tx => {
     a. pelanggan & semua produk ada dan aktif       → 422
     b. per item, urut product_id:
          UPDATE products SET stock = stock - qty
          WHERE id = ? AND deleted_at IS NULL AND stock >= qty
        0 baris ter-update = stok kurang; semua item dicek dulu
                                                     → 409 { "items.N.quantity": ["Stok X tersisa 3, diminta 5"] }
     c. unit_price = harga di DB (snapshot); total = Σ subtotal (Decimal)
     d. order_number INV-YYYYMMDD-XXXX via upsert order_counters (tanggal WIB)
     e. insert orders + order_items
   })
4. Error di langkah mana pun → ROLLBACK: stok, counter, order, item kembali semula
```

- **Race condition.** Cek dan potong stok dalam *satu* statement `UPDATE … WHERE stock >= qty`, bukan baca-lalu-tulis. Diuji: 5 order konkuren untuk stok 2 → tepat 2 sukses, 3 mendapat 409. `CHECK (stock >= 0)` menjadi pengaman terakhir.
- **Anti deadlock.** Item diproses urut `product_id`.
- **Nomor order.** `INSERT … ON CONFLICT DO UPDATE` ikut transaksi: tidak ada nomor ganda maupun bolong.
- **Frontend.** Jumlah item dibatasi stok saat diinput dan dicek ulang sebelum submit; error 409 dari server dipetakan ke baris item yang bermasalah.
- **Zona waktu.** Nomor order, filter tanggal, dan grafik harian memakai hari kalender Asia/Jakarta; DB menyimpan UTC.
- **Soft delete.** Produk/pelanggan terhapus tidak bisa dipesan, tetapi riwayat order tetap utuh.

### Tambahan terhadap struktur database soal

| Tambahan | Alasan |
|---|---|
| `products.image_url` | Thumbnail produk (opsional). |
| Tabel `sessions` | Hash refresh token → rotasi, deteksi reuse, logout yang me-revoke token. |
| Tabel `order_counters` | Nomor order harian yang aman konkuren dan ikut rollback. |
| CHECK constraint | `stock >= 0`, `price > 0`, `quantity > 0`, dll. — aturan bisnis dijaga juga di DB. |
| Index | Kolom yang dipakai search/sort/filter/join, plus unique `email`, `product_code`, `order_number`. |
| Uang `DECIMAL` | Tanpa pembulatan float; di JSON dikirim sebagai string (`"12000.00"`). |

---

## API

Semua endpoint ber-prefix `/api` dan wajib Bearer token kecuali `auth/login`, `auth/refresh`, `health`. Daftar lengkap & contoh:

- Swagger UI: http://localhost:4000/api/docs · OpenAPI: [`backend/docs/openapi.json`](backend/docs/openapi.json)
- Postman: [`backend/docs/azatech-api.postman_collection.json`](backend/docs/azatech-api.postman_collection.json) (25 request dengan test; jalankan *Auth / Login* lebih dulu)

Status code: `201` dibuat · `204` hapus/logout · `401` token invalid · `404` tidak ditemukan · `409` kode duplikat / stok kurang · `422` validasi · `429` rate limit.

---

## Testing

| Perintah | Isi |
|---|---|
| `cd backend && pnpm test` | Unit test fungsi murni |
| `cd backend && pnpm test:e2e` | 35 test e2e terhadap PostgreSQL (butuh `docker compose up -d db` dan `cp .env.test.example .env.test`) |
| `cd frontend && pnpm test` | Vitest: format Rupiah/tanggal, alur order, filter riwayat, silent refresh |

Skenario wajib soal tercakup: order sukses, stok tidak cukup (409 dan tidak ada stok berkurang), validasi gagal (422), tanpa token (401). Ditambah race condition, rotasi refresh token, CRUD, dan dashboard. CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) menjalankan lint, test, build, dan `docker compose build`.

---

## Asumsi, keterbatasan & rencana perbaikan

**Asumsi** — satu peran pengguna (admin/kasir, belum ada RBAC); order bersifat final (belum ada batal/retur); harga Rupiah termasuk pajak; stok < 5 dianggap menipis.

**Keterbatasan**
- Token di `localStorage` (rentan XSS); lebih aman refresh token di cookie `httpOnly`.
- Rate limit in-memory per instance; multi-instance butuh Redis.
- Search `ILIKE '%…%'` tidak memakai index; data besar sebaiknya `pg_trgm`.
- Image backend ±1 GB karena menyertakan devDependencies untuk migrasi & seeder.

**Jika ada waktu lebih** — export CSV/Excel, pembatalan order dengan pengembalian stok, test E2E browser (Playwright).

**Status bonus:** ✅ `docker compose up` · ✅ GitHub Actions · ✅ grafik penjualan harian · ✅ test frontend · ✅ unduh faktur PDF · ⬜ export CSV/Excel.

---

## AI Usage

**Tool:** Claude Code (Anthropic, model Claude Opus), dipakai untuk backend dan frontend.

**Cara kerja.** AI saya posisikan sebagai pengetik kode, bukan pengambil keputusan:

1. **Saya menyusun PRD lebih dulu** (`PRD-backend.md`, `PRD-frontend.md`): logika bisnis, arsitektur, desain database, kontrak API, dan alur pengguna. Contohnya: stok dipotong dengan conditional `UPDATE` di dalam transaksi, harga hanya dihitung di server, format error per item, dan rotasi refresh token.
2. **Eksekusi bertahap per batch.** Setiap batch berisi satu bagian dari PRD (fondasi, auth, products/customers, orders, dashboard + seeder, frontend per halaman, Docker/CI). AI menuliskan kodenya sesuai arahan tersebut.
3. **Setiap batch saya review, verifikasi** (build, lint, test, coba langsung di aplikasi), dan perbaiki bila arahnya keliru, sebelum di-commit dan lanjut ke batch berikutnya.

Sebagian besar kode diketik oleh AI. Yang saya pegang adalah logika bisnis, arsitektur, dan arah aplikasi, serta keputusan apakah hasil AI diterima. Saya bertanggung jawab atas seluruh kode di repository ini dan dapat dijelaskan.
