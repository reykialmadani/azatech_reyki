# Frontend — Azatech Online Shop

Next.js 16 (App Router) · React 19 · TypeScript strict · TanStack Query · React Hook Form + Zod · Tailwind CSS 4 + shadcn/ui · Recharts · Vitest.

Gambaran umum & cara menjalankan seluruh stack dengan Docker ada di [README root](../README.md).

## Setup lokal

```bash
cp .env.example .env.local
pnpm install
pnpm dev                 # http://localhost:3000
```

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL backend, default `http://localhost:4000/api` (dibakukan saat build) |
| `NEXT_PUBLIC_USE_MOCK` | `true` = memakai mock API in-memory tanpa backend (login mock `admin@azatech.id` / `password`) |

## Scripts

| Script | Fungsi |
|---|---|
| `dev` / `build` / `start` | Development / build produksi (`output: standalone`) / jalankan hasil build |
| `lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `test` | Vitest (jsdom) terhadap mock API |

## Halaman

| Route | Isi |
|---|---|
| `/login` | Login + pesan sesi berakhir (`?expired=true`) |
| `/dashboard` | Kartu ringkasan, grafik penjualan harian 30 hari, produk terlaris, peringatan stok menipis |
| `/products`, `/customers` | Tabel dengan pagination & search (debounce), sort pada produk; dialog tambah/edit tervalidasi; konfirmasi hapus |
| `/orders/new` | Kasir: pilih pelanggan, tambah/hapus baris produk, subtotal & total otomatis, error stok dari server ditempel ke baris item |
| `/orders`, `/orders/[id]` | Riwayat dengan filter tanggal & pelanggan; detail / invoice |

Semua halaman di grup `(app)` dilindungi `AuthGuard` (redirect ke `/login` jika belum login).

## Struktur `src/`

```
app/              routing (App Router): (auth)/login, (app)/…
components/       per fitur (products, customers, orders, dashboard, layout, shared) + ui/ (shadcn)
hooks/            hook TanStack Query per resource (use-products, use-orders, …)
lib/api/          client.ts (fetch + envelope + error), modul per resource, mock/ (mock API)
lib/schemas/      skema Zod form (mencerminkan validasi backend)
lib/auth/         penyimpanan token
lib/format.ts     format Rupiah ("Rp 12.000") & tanggal Indonesia
types/            kontrak API (snake_case, uang sebagai string desimal)
```

## Integrasi dengan backend

- **Envelope:** response `{ success, message, data, meta? }`; error `{ success:false, message, errors? }` → dilempar sebagai `ApiError` (`status`, `errors`).
- **Error per field:** `applyServerErrors()` memetakan kunci dot-notation (`items.1.quantity`) dari 409/422 langsung ke field React Hook Form.
- **Token:** access + refresh token di `localStorage`. Saat 401, `client.ts` mencoba **silent refresh** sekali (request 401 yang bersamaan berbagi satu proses refresh karena refresh token dirotasi), lalu mengulang request; jika gagal → hapus sesi dan redirect ke `/login?expired=true`.
- **Harga tidak pernah dikirim** saat membuat order — hanya `product_id` & `quantity`; total di layar hanya pratinjau, angka final dari server.
- Setelah mutasi, query terkait di-*invalidate* (mis. buat order → produk, riwayat, dashboard) sehingga stok & ringkasan otomatis ter-update.
