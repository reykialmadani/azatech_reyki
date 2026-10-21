# PANDUAN LENGKAP BELAJAR BACKEND AZATECH
### Dokumen Khusus Persiapan Review & Live Coding (Technical Test Medior Fullstack)

> **Catatan untuk Anda:**  
> Tenang dan jangan panik. Dokumen ini dibuat khusus dengan bahasa yang manusiawi, terstruktur, dan tidak berbelit-belit. Tujuannya adalah agar Anda yang sebelumnya belum terbiasa menulis kode backend bisa **memahami gambaran besar (mental model)**, tahu **di mana letak setiap file**, tahu **apa tugas masing-masing komponen**, dan bisa **menjelaskan serta memodifikasi kode dengan percaya diri** saat sesi review atau live coding besok.

---

## DAFTAR ISI
1. [Mental Model: Analogi Restoran (Memahami Arsitektur NestJS)](#1-mental-model-analogi-restoran)
2. [Pelajaran Basic: Tiga Serangkai di Setiap Fitur (Controller, Service, Module) - Contoh: `/orders`](#2-pelajaran-basic-tiga-serangkai-di-setiap-fitur-controller-service-module---contoh-orders)
3. [Peta Struktur Folder & File (Di Mana Apa?)](#3-peta-struktur-folder--file)
4. [Alur Perjalanan Request (Request Lifecycle)](#4-alur-perjalanan-request)
5. [Bedah Modul & Fitur Utama](#5-bedah-modul--fitur-utama)
   - 5.1 Modul Auth (Login, JWT, Sesi)
   - 5.2 Modul Products (CRUD Produk & Soft Delete)
   - 5.3 Modul Customers (CRUD Pelanggan)
   - 5.4 Modul Orders (Transaksi Penjualan Atomik)
   - 5.5 Modul Dashboard (Statistik Penjualan)
6. [Topik Krusial & Pertanyaan "Jebakan" Reviewer (Cheat Sheet Jawaban)](#6-topik-krusial--pertanyaan-jebakan-reviewer)
7. [Simulasi Live Coding: "Bagaimana Jika Besok Disuruh Ubah Kode?"](#7-simulasi-live-coding-modifikasi-kode)
8. [Cheat Sheet Perintah Terminal (Command List)](#8-cheat-sheet-perintah-terminal)

---

## 1. Mental Model: Analogi Restoran

Backend kita menggunakan framework bernama **NestJS** dengan database **PostgreSQL** dan ORM **Prisma**.  
Agar Anda langsung paham tanpa bingung istilah teknis, bayangkan backend ini seperti sebuah **Restoran Modern**:

```
[ Klien / Browser / Postman ]
             │ (Kirim HTTP Request)
             ▼
   [ 1. Satpam Pintu (Guard / JwtAuthGuard) ]
             │ (Cek apakah punya Token Login)
             ▼
   [ 2. Petugas Skrining (Pipe / ValidationPipe) ]
             │ (Cek formulir DTO: apakah data lengkap & valid?)
             ▼
   [ 3. Pelayan Restoran (Controller) ]
             │ (Menerima request URL, memanggil koki yang sesuai)
             ▼
   [ 4. Koki Dapur (Service) ] ── (Pusat Logika Bisnis & Perhitungan)
             │
             ▼
   [ 5. Petugas Gudang (Prisma ORM) ]
             │ (Mengambil / menyimpan data ke rak)
             ▼
   [ 6. Gudang Utama (Database PostgreSQL) ]
```

### Arti Istilah Pokok NestJS:
| Istilah | Analogi | Tugas Sebenarnya di Kode |
|---|---|---|
| **Module** (`*.module.ts`) | Departemen / Ruangan | Wadah pengelompokan. Mendaftarkan siapa Controller-nya dan siapa Service-nya. |
| **Controller** (`*.controller.ts`) | Pelayan Meja | Menerima URL (misal `GET /api/products`), mengatur status code (200, 201, 204), lalu meneruskan data ke Service. Controller tidak boleh memuat logika bisnis rumit! |
| **DTO** (`*.dto.ts`) | Formulir Pesanan | Data Transfer Object. Format kertas pesanan yang menentukan data apa yang wajib diisi, tipe datanya (string, number), minimal/maksimal karakter. |
| **Service** (`*.service.ts`) | Koki Dapur | **Otak aplikasi**. Tempat semua aturan bisnis dijalankan: cek stok, potong stok, hitung harga, simpan transaksi ke database. |
| **Prisma (ORM)** | Jembatan ke Database | Penghubung bahasa TypeScript ke bahasa SQL Database. Kita tidak perlu tulis `SELECT * FROM products`, cukup tulis `this.prisma.product.findMany()`. |
| **Guard** (`*.guard.ts`) | Satpam / Bouncer | Memeriksa apakah user sudah login dengan memeriksa Bearer Token JWT di header. |
| **Filter** (`*.filter.ts`) | Layanan Pengaduan | Jika ada error di tengah jalan, Filter menangkap error tersebut dan mengubahnya menjadi pesan JSON rapi untuk pengguna. |
| **Interceptor** (`*.interceptor.ts`) | Pembungkus Makanan | Membungkus response sukses menjadi format standar: `{ success: true, message: "...", data: ... }`. |

---

## 2. Pelajaran Basic: Tiga Serangkai di Setiap Fitur (Controller, Service, Module) — Contoh: `/orders`

Jika Anda membuka folder fitur apa pun di `src/`, misalnya `src/orders/`, `src/products/`, `src/customers/`, atau `src/auth/`, Anda akan selalu melihat **pola 3 file yang sama**:
1. `*.controller.ts`
2. `*.service.ts`
3. `*.module.ts`

Kenapa selalu ada 3 file ini? Kenapa tidak dijadikan 1 file saja? Mari kita bedah secara mendalam!

```
                       Folder: /src/orders/
      ┌─────────────────────────────────────────────────────┐
      │                                                     │
      │   [ orders.controller.ts ] ───▶ Menerima HTTP URL   │
      │              │                                      │
      │              ▼ (memanggil)                          │
      │   [ orders.service.ts ]    ───▶ Otak & Hitungan DB  │
      │              ▲                                      │
      │              │ (didaftarkan di)                     │
      │   [ orders.module.ts ]     ───▶ Kabel Penghubung    │
      │                                                     │
      │   + File Pendukung:                                 │
      │     - dto/                 ───▶ Kertas Validasi     │
      │     - order.mapper.ts      ───▶ Pembungkus Format   │
      └─────────────────────────────────────────────────────┘
```

---

### 2.1 Mengapa Harus Dipisah Menjadi 3 File?
Di dunia software engineering profesional, ini disebut prinsip **Separation of Concerns (Pemisahan Tanggung Jawab)**:
* **Jika dijadikan 1 file:** Kodenya akan sangat panjang (ribuan baris), tercampur antara urusan routing HTTP, validasi form, rumus matematika, dan query database. Jika ada bug atau ingin ganti database, seluruh file rawan rusak.
* **Dengan dipisah 3 file:**
  - Jika ingin mengubah alamat URL atau status code HTTP (200, 201), Anda cukup buka **Controller**.
  - Jika ingin mengubah cara hitung diskon, cek stok, atau rumus total belanja, Anda cukup buka **Service**.
  - Jika ingin mendaftarkan komponen baru ke sistem NestJS, Anda cukup buka **Module**.

---

### 2.2 Bedah Kasus Nyata di Folder `/orders`:

#### 1. `orders.controller.ts` (Pelayan Meja / Handler HTTP)
Tugas Controller **hanya** menerima request dari luar (browser / Postman), membaca parameter, dan menyerahkannya ke Service.

Lihat potongan kode aslinya di `src/orders/orders.controller.ts`:
```typescript
@Controller('orders') // <-- Artinya semua route di file ini berawalan /api/orders
export class OrdersController {
  // Pelayan ini memegang nomor telepon Koki (Service)
  constructor(private readonly orders: OrdersService) {}

  @Post() // <-- Menangani HTTP POST /api/orders
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
    // Controller TIDAK menghitung stok, TIDAK query ke database!
    // Tugasnya hanya menyerahkan DTO dan user.id ke Service:
    return this.orders.create(dto, user.id);
  }
}
```
* **Karakteristik Controller:**
  - Selalu ada dekorator `@Controller(...)`.
  - Menggunakan dekorator HTTP seperti `@Get()`, `@Post()`, `@Put()`, `@Delete()`.
  - Mengambil data dari request menggunakan `@Body()` (isi form), `@Param()` (parameter ID URL misal `/orders/1`), atau `@Query()` (filter URL misal `?page=1`).

---

#### 2. `orders.service.ts` (Koki Dapur / Pusat Logika Bisnis & Database)
Tugas Service adalah **mengerjakan seluruh pekerjaan berat**: memeriksa stok barang, memastikan harga tidak dicurangi user, memotong stok, meminta nomor invoice, dan menyimpan transaksi ke database.

Lihat potongan kode aslinya di `src/orders/orders.service.ts`:
```typescript
@Injectable() // <-- Menandakan kelas ini adalah penyedia layanan (bisa disuntikkan)
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,            // Alat akses database
    private readonly orderNumbers: OrderNumberService, // Pembuat nomor invoice
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    // 1. Logika bisnis: Buka transaksi database atomik
    return await this.prisma.$transaction(async (tx) => {
      // 2. Cek customer aktif
      await this.assertActiveCustomer(tx, dto.customer_id);

      // 3. Cek ketersediaan produk & potong stok
      await this.decrementStock(tx, lines, products);

      // 4. Hitung harga asli dari DB (Snapshot)
      // 5. Simpan ke tabel order dan order_items
      return tx.order.create({ ... });
    });
  }
}
```
* **Karakteristik Service:**
  - Selalu diawali `@Injectable()`.
  - Tidak peduli siapa yang memanggilnya (apakah dipanggil dari HTTP Controller, dari background job, atau dari automated unit test).
  - Berisi `async/await` dan pemanggilan `this.prisma` untuk manipulasi data database.

---

#### 3. `orders.module.ts` (Kabel Penghubung / Dokumen Pendaftaran)
NestJS tidak bisa otomatis tahu kalau `OrdersController` dan `OrdersService` itu saling membutuhkan. `Module` adalah tempat di mana mereka **didaftarkan secara resmi**.

Lihat isi lengkap file `src/orders/orders.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrderNumberService } from './order-number.service.js';

@Module({
  controllers: [OrdersController],                       // Pelayan yang didaftarkan
  providers: [OrdersService, OrderNumberService],        // Koki & helper yang didaftarkan
  exports: [OrdersService, OrderNumberService],          // Jika modul lain (misal Dashboard) ingin pinjam
})
export class OrdersModule {}
```
* **Arti 3 properti utama di `@Module`:**
  - `controllers`: Mendaftarkan controller apa saja yang menangani request web di modul ini.
  - `providers`: Mendaftarkan service apa saja yang menyediakan logika bisnis (bisa di-inject).
  - `exports`: Jika modul lain (seperti `DashboardModule`) butuh memanggil method di `OrdersService`, kita harus memasukkannya ke dalam `exports`.
* **Koneksi ke Induk (`app.module.ts`):**  
  Semua modul fitur (`OrdersModule`, `ProductsModule`, `CustomersModule`, `AuthModule`) kemudian didaftarkan ke modul utama yaitu [app.module.ts](file:///c:/azatech/backend/src/app.module.ts) di dalam array `imports: [...]`.

---

### 2.3 Dua File Pendukung Tambahan di Folder Fitur:

Selain 3 file inti di atas, di folder fitur Anda akan sering menemukan:
1. **Folder `dto/` (Data Transfer Object):**  
   Contoh: `create-order.dto.ts`. Ini adalah **kertas formulir input**. Isinya aturan validasi: apakah kolom wajib diisi, apakah bertipe angka, apakah nilainya minimal 1.  
   *Contoh:* `@IsInt({ message: 'Quantity harus angka bulat' }) @Min(1)`.
2. **File `mapper.ts` (Penerjemah / Pembungkus):**  
   Contoh: `order.mapper.ts` atau `product.mapper.ts`. Database PostgreSQL menyimpan data dengan nama kolom SQL dan tipe data Decimal. Tugas mapper adalah menerjemahkan data mentah database tersebut ke bentuk JSON yang rapi, ramah, dan siap dikonsumsi oleh tim Frontend (misal mengubah tipe Decimal menjadi string `"12000.00"`).

---

### 2.4 Bagaimana Ketiganya Saling Terhubung? (Dependency Injection)
Di pemrograman konvensional, jika Controller butuh Service, orang biasanya menulis:
`const koki = new OrdersService();` ❌ (Manual dan kaku).

Di NestJS, kita menggunakan teknik modern bernama **Dependency Injection (DI)**:
* Anda cukup menulis di constructor Controller:
  ```typescript
  constructor(private readonly orders: OrdersService) {}
  ```
* NestJS akan otomatis membuatkan instance `OrdersService`, menyiapkan koneksi databasenya, dan menyuntikkannya ke dalam Controller Anda. Anda tinggal pakai tanpa repot inisialisasi manual!

---

### 2.5 Urutan Mental: Jika Besok Disuruh Membuat / Mengubah Fitur Baru
Jika di sesi review besok penguji berkata: *"Coba tambahkan fitur X"*, ingat urutan langkah ini di kepala Anda:
1. **Langkah 1 (DTO):** Tentukan formulir datanya (data apa yang dikirim client? apa validasinya?).
2. **Langkah 2 (Service):** Tulis logika perhitungannya dan cara simpan/baca ke database lewat Prisma.
3. **Langkah 3 (Controller):** Buat pintu URL-nya (GET / POST / PUT / DELETE) dan panggil Service.
4. **Langkah 4 (Module):** Pastikan Controller dan Service sudah terdaftar di file Module-nya.

---

## 3. Peta Struktur Folder & File

Berikut adalah direktori folder `/backend` dan apa fungsi dari masing-masing folder/file:

```
backend/
├── prisma/                          <-- Pengaturan Database & Seeder
│   ├── schema.prisma                <-- Blueprint tabel database (User, Product, Customer, Order)
│   ├── seed.ts                      <-- Data awal (Dummy data untuk demo: admin, produk, customer)
│   └── migrations/                  <-- Riwayat perubahan struktur tabel SQL
│
├── src/                             <-- SOURCE CODE UTAMA BACKEND
│   ├── main.ts                      <-- Pintu masuk pertama (Entry Point) saat server menyala
│   ├── configure-app.ts             <-- Pasang middleware (CORS, Helmet, Validator, Error Filter)
│   ├── app.module.ts                <-- Modul induk yang menggabungkan seluruh modul aplikasi
│   ├── swagger.ts                   <-- Dokumentasi API otomatis (bisa dibuka di browser)
│   │
│   ├── auth/                        <-- Fitur Autentikasi (Login, Token, User Profile)
│   │   ├── auth.controller.ts       <-- Endpoint: /api/auth/login, /api/auth/logout, /api/auth/me
│   │   ├── auth.service.ts          <-- Logika cek password (argon2) & pembuatan token JWT
│   │   ├── guards/jwt-auth.guard.ts <-- Satpam pengaman route (semua route terkunci kecuali publik)
│   │   └── dto/                     <-- Validasi input email & password
│   │
│   ├── products/                    <-- Fitur Manajemen Produk
│   │   ├── products.controller.ts   <-- Endpoint: GET, POST, PUT, DELETE /api/products
│   │   ├── products.service.ts      <-- Logika pencarian, sorting, pagination, soft-delete produk
│   │   ├── product.mapper.ts        <-- Mengubah format database ke format JSON frontend
│   │   └── dto/                     <-- Aturan validasi: nama wajib, harga > 0, stok >= 0
│   │
│   ├── customers/                   <-- Fitur Pelanggan
│   │   ├── customers.controller.ts  <-- Endpoint: GET, POST, PUT, DELETE /api/customers
│   │   ├── customers.service.ts     <-- Logika CRUD data pelanggan
│   │   └── dto/                     <-- Aturan validasi pelanggan (gender, tgl lahir, HP)
│   │
│   ├── orders/                      <-- JANTUNG SISTEM: Penjualan & Transaksi
│   │   ├── orders.controller.ts     <-- Endpoint: POST /api/orders, GET /api/orders/:id
│   │   ├── orders.service.ts        <-- Logika transaksi atomik, cek stok, potong stok, hitung total
│   │   ├── order-number.service.ts  <-- Pembuat nomor invoice INV-YYYYMMDD-XXXX anti-bentrok
│   │   ├── order.mapper.ts          <-- Mengubah data order dan item-nya untuk frontend
│   │   └── dto/                     <-- Validasi keranjang belanja (customer_id, list items)
│   │
│   ├── dashboard/                   <-- Fitur Statistik Ringkasan
│   │   ├── dashboard.controller.ts  <-- Endpoint: GET /api/dashboard/summary
│   │   └── dashboard.service.ts     <-- Hitung total omset, transaksi, produk terlaris, stok menipis
│   │
│   ├── common/                      <-- Kode Bersama (Reusable Utility)
│   │   ├── decorators/              <-- @Public() agar endpoint tidak perlu login, @CurrentUser()
│   │   ├── exceptions/              <-- Format error standar API
│   │   ├── filters/                 <-- Menangkap error dan mengembalikan JSON seragam
│   │   ├── interceptors/            <-- Membungkus response sukses `{ success: true, ... }`
│   │   ├── pipes/                   <-- Validasi ID angka / UUID
│   │   └── utils/                   <-- Format tanggal WIB (Jakarta), kalkulasi pagination
│   │
│   └── prisma/                      <-- Penghubung Prisma ke NestJS
│       └── prisma.service.ts        <-- Database Client yang siap di-inject ke semua service
│
├── test/                            <-- Automated Test (E2E Integration Test)
│   ├── auth.e2e-spec.ts             <-- Menguji flow login & refresh token
│   ├── products.e2e-spec.ts         <-- Menguji CRUD produk
│   └── orders.e2e-spec.ts           <-- Menguji skenario sukses, stok kurang, rollback transaksi
│
├── package.json                     <-- Daftar library dan script terminal (pnpm run dev, test, dll)
├── .env                             <-- Konfigurasi rahasia lokal (PORT, DATABASE_URL, JWT_SECRET)
└── technical-test-medior-fullstack.md <-- Dokumen soal asli dari interviewer
```

---

## 4. Alur Perjalanan Request (Request Lifecycle)

Bayangkan seorang user di web ingin membuat pesanan (Order). Bagaimana kodingan bekerja dari detik pertama request dikirim?

1. **Browser / Frontend** mengirim `POST /api/orders` dengan data `{ customer_id: "...", items: [...] }` dan membawa Header `Authorization: Bearer <token>`.
2. **`main.ts` & `configure-app.ts`**: Request masuk ke server NestJS.
3. **`JwtAuthGuard`**: Memeriksa token JWT. Jika token salah/expired, langsung tolak dengan status `401 Unauthorized`. Jika benar, identitas user ditempelkan ke objek request (`req.user`).
4. **`ValidationPipe` & `CreateOrderDto`**: Memeriksa apakah `customer_id` berformat UUID valid? Apakah `items` minimal berisi 1 barang? Apakah quantity > 0? Jika salah, tolak dengan status `422 Unprocessable Entity`.
5. **`orders.controller.ts`**: Menerima request yang sudah bersih dan valid. Pelayan controller memanggil: `this.orders.create(dto, req.user.id)`.
6. **`orders.service.ts`**: Koki dapur mulai bekerja:
   - Membuka satu sesi transaksi database: `this.prisma.$transaction(...)`.
   - Cek apakah Customer ada dan aktif.
   - Cek apakah semua Produk ada dan stoknya mencukupi.
   - Potong stok produk di database.
   - Ambil harga asli produk dari database (bukan percaya dari frontend!).
   - Hitung subtotal dan total harga.
   - Buat nomor invoice baru `INV-YYYYMMDD-0001` lewat `OrderNumberService`.
   - Simpan data ke tabel `orders` dan `order_items`.
   - Jika semua berhasil -> simpan permanen (Commit). Jika ada 1 produk yang stoknya kurang -> batalkan semua langkah (Rollback).
7. **`ResponseInterceptor`**: Membungkus hasil order menjadi `{ success: true, message: "Order berhasil dibuat", data: { ... } }`.
8. **Browser / Frontend**: Menerima response sukses dengan kode `201 Created`.

---

## 5. Bedah Modul & Fitur Utama

### 5.1 Modul Auth (`src/auth/`)
* **Tugas:** Menangani siapa yang boleh masuk sistem.
* **File penting:**
  - `auth.service.ts`: Fungsi `login()` mencocokkan email, lalu verifikasi hash password menggunakan `argon2`. Jika cocok, buat token JWT.
  - `guards/jwt-auth.guard.ts`: Satpam global. Secara default, **semua endpoint di sistem terkunci** kecuali ada tanda `@Public()`.
* **Kunci Jawaban Interview:**
  > *"Kenapa menggunakan Guard global? Karena prinsip Security by Default. Lebih aman mengunci semua pintu lalu membuka yang perlu saja (seperti login), daripada lupa mengunci endpoint sensitif."*

### 5.2 Modul Products (`src/products/`)
* **Tugas:** Mengelola katalog barang (tambah, edit, list, hapus).
* **Fitur Utama:**
  - **Pagination, Search, & Sort:** List produk bisa dicari berdasarkan nama atau kode barang, diurutkan (`sort=price:asc` atau `sort=stock:desc`), dan dipecah per halaman (`page=1&per_page=10`).
  - **Soft Delete:** Saat produk dihapus (`DELETE /api/products/:id`), datanya **TIDAK dibuang dari database**. Hanya kolom `deleted_at` yang diisi timestamp saat itu.
* **Kunci Jawaban Interview:**
  > *"Kenapa produk di-soft-delete? Supaya riwayat transaksi masa lalu (order items) tidak rusak karena foreign key yang hilang. Produk yang sudah dihapus tidak akan muncul di katalog toko, tetapi tetap bisa tampil saat melihat invoice belanja tahun lalu."*

### 5.3 Modul Customers (`src/customers/`)
* **Tugas:** Menyimpan data pelanggan (nama, alamat, jenis kelamin, tanggal lahir, telepon).
* **File penting:** `customers.service.ts` dan `customers.controller.ts`. ID customer menggunakan tipe UUID agar aman dan tidak mudah ditebak orang luar.

### 5.4 Modul Orders (`src/orders/`) — INI BAGIAN PALING PENTING!
Modul ini memiliki bobot nilai tertinggi (30%) di mata reviewer!
* **File penting:**
  - `orders.service.ts`: Menjalankan method `create()`.
  - `order-number.service.ts`: Membuat nomor invoice.
* **2 Aturan Emas Bisnis Order:**
  1. **Harga Tidak Boleh dari Client:**  
     Frontend hanya boleh mengirim `product_id` dan `quantity`. Backend yang mencari harga produk langsung ke database (`products.price`). Ini mencegah user nakal mengubah harga sendiri (misal barang Rp 1.000.000 diubah jadi Rp 1).
  2. **Transaksi Atomik (All or Nothing):**  
     Semua proses dimasukkan ke dalam `this.prisma.$transaction(...)`. Jika pembeli memesan 3 barang, dan barang ke-3 stoknya habis, maka pengurangan stok barang ke-1 dan ke-2 **otomatis dibatalkan (rollback)**. Tidak boleh ada pesanan setengah jadi.

### 5.5 Modul Dashboard (`src/dashboard/`)
* **Tugas:** Menyajikan data ringkasan untuk halaman awal admin.
* **Informasi yang dihitung:**
  - Total transaksi dan total omset penjualan (Rp).
  - 5 Produk terlaris (`top_products`).
  - Produk dengan stok menipis (< 5 unit).
  - Tren penjualan harian selama 30 hari terakhir berdasarkan waktu Jakarta (WIB).

---

## 6. Topik Krusial & Pertanyaan "Jebakan" Reviewer

Jika interviewer bertanya pertanyaan konseptual, gunakan contekan jawaban di bawah ini:

### Q1: "Kenapa Anda membungkus proses pembuatan order ke dalam database transaction?"
**Jawaban Anda:**  
> *"Karena proses checkout terdiri dari banyak langkah berantai: validasi pelanggan, pemotongan stok beberapa produk, kalkulasi harga, pembuatan nomor invoice, dan penyimpanan baris pesanan. Dengan `prisma.$transaction`, kita menjamin sifat **ACID (Atomicity)**: semua langkah harus berhasil bersama-sama. Jika di tengah jalan stok barang kedua habis atau jaringan putus, seluruh perubahan database di-rollback ke kondisi semula. Tidak akan ada stok yang berkurang tanpa adanya invoice."*

---

### Q2: "Bagaimana cara Anda mencegah Race Condition saat dua user memesan stok barang terakhir secara bersamaan?"
**Jawaban Anda:**  
> *"Kita mengamankannya di level database query. Saat memotong stok, kita tidak membaca stok lalu melakukan update biasa. Kita menjalankan query bersyarat:*  
> `UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty`  
> *Jika stok awal adalah 1 dan ada dua transaksi paralel yang meminta 1, hanya transaksi pertama yang berhasil mengupdate 1 baris. Transaksi kedua akan mendapati baris yang ter-update adalah 0, sehingga sistem langsung melempar error `Stok tidak cukup` dan membatalkan transaksi. Selain itu, di tabel database ada pengaman terakhir berupa `CHECK (stock >= 0)`."*

---

### Q3: "Bagaimana cara penomoran invoice `INV-YYYYMMDD-XXXX` digenerate agar tidak bentrok saat trafik tinggi?"
**Jawaban Anda:**  
> *"Kita menggunakan tabel bantu bernama `order_counters` dengan primary key kolom `date` (format YYYYMMDD waktu WIB). Di dalam transaksi order, kita melakukan operasi atomik `upsert` dengan increment `last_seq`. Database Postgres mengunci baris counter untuk tanggal tersebut sampai transaksi selesai. Dengan cara ini, nomor invoice dijamin urut, tidak pernah duplikat, dan jika order gagal, nomor urut tidak akan loncat/bolong."*

---

### Q4: "Kenapa tipe data uang menggunakan `Decimal`, bukan `Float`?"
**Jawaban Anda:**  
> *"Tipe data `Float` atau `Double` di komputer menggunakan representasi biner yang memiliki kelemahan presisi (floating point rounding error), misalnya `0.1 + 0.2 = 0.30000000000000004`. Untuk aplikasi finansial atau e-commerce, ini bisa mengakibatkan selisih saldo. Oleh karena itu, kita wajib menggunakan `Decimal` (tipe `numeric` di PostgreSQL) agar perhitungan uang tepat hingga sen terkecil."*

---

## 7. Simulasi Live Coding: "Bagaimana Jika Besok Disuruh Ubah Kode?"

Jika reviewer berkata: *"Bisa tolong modifikasi kode ini sedikit?"*, berikut adalah panduan tindakan langsung berdasarkan skenario yang paling sering diminta:

### Skenario A: "Tolong tambahkan validasi: stok maksimal saat input produk adalah 500"
* **Buka file:** [product.dto.ts](file:///c:/azatech/backend/src/products/dto/product.dto.ts)
* **Cari bagian:** Properti `stock: number;`
* **Ubah menjadi:**
  ```typescript
  @IsInt({ message: 'Stok harus bilangan bulat' })
  @Min(0, { message: 'Stok tidak boleh negatif' })
  @Max(500, { message: 'Stok tidak boleh lebih dari 500' }) // <-- Ganti angka di sini
  stock: number;
  ```

---

### Skenario B: "Tolong ubah batas stok menipis di Dashboard dari < 5 menjadi < 10"
* **Buka file:** [dashboard.service.ts](file:///c:/azatech/backend/src/dashboard/dashboard.service.ts)
* **Cari query low stock:** (biasanya ada tulisan `stock: { lt: 5 }` atau sejenisnya)
* **Ubah angka 5 menjadi 10:**
  ```typescript
  where: {
    deletedAt: null,
    stock: { lt: 10 }, // <-- Cukup ubah angka ini
  }
  ```

---

### Skenario C: "Tolong tambahkan filter pencarian baru di Pelanggan (misal filter berdasarkan gender)"
* **Langkah 1 (DTO):** Buka `src/customers/dto/list-customers-query.dto.ts`. Tambahkan:
  ```typescript
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
  ```
* **Langkah 2 (Service):** Buka `src/customers/customers.service.ts`. Di bagian objek `where`, tambahkan:
  ```typescript
  if (query.gender) {
    where.gender = query.gender;
  }
  ```

---

### Skenario D: "Tolong jelaskan apa yang dilakukan potongan kode ini"
Jika reviewer menunjuk fungsi `create` di [orders.service.ts](file:///c:/azatech/backend/src/orders/orders.service.ts):
* **Cara menjelaskannya dengan lancar:**
  1. *"Pertama, baris 43 mengekstrak daftar item dan memeriksa apakah ada produk duplikat yang dikirim."*
  2. *"Kedua, baris 50 membuka `this.prisma.$transaction` agar seluruh proses di bawahnya bersifat atomik."*
  3. *"Ketiga, baris 51-53 memverifikasi bahwa customer masih aktif, produk masih ada di katalog, dan mencoba mengurangi stok dengan query bersyarat."*
  4. *"Keempat, baris 56-63 mengambil harga resmi dari database untuk menghitung subtotal tiap barang dan total belanja."*
  5. *"Kelima, baris 68 meminta nomor invoice baru dari `OrderNumberService`."*
  6. *"Keenam, baris 66-76 menyimpan data order ke tabel `orders` beserta detail item-nya ke tabel `order_items`."*
  7. *"Terakhir, jika semua sukses, transaksi di-commit dan hasilnya diformat rapi lewat `toOrderDetail` untuk dikembalikan ke frontend."*

---

## 8. Cheat Sheet Perintah Terminal

Jalankan perintah ini di dalam folder `c:\azatech\backend` menggunakan PowerShell atau Terminal VS Code:

| Kebutuhan | Perintah |
|---|---|
| **Menjalankan Server Backend** | `pnpm start:dev` *(Server otomatis reload jika kode diubah)* |
| **Menjalankan Automated Test E2E** | `pnpm test:e2e` *(Untuk membuktikan semua fitur dan validasi berjalan sempurna)* |
| **Reset Database & Isi Ulang Data Seed** | `pnpm db:reset` *(Akan membuat database bersih dan mengisi ulang data dummy)* |
| **Melihat Dokumentasi Swagger di Browser** | Nyalakan server, lalu buka: `http://localhost:3000/api/docs` |
| **Memeriksa Kerapihan / Lint Kode** | `pnpm lint` |

---

### Tips Mental Saat Review:
1. **Jangan terburu-buru mengetik.** Jika diminta mengubah sesuatu, tenangkan diri, tarik napas, lalu katakan: *"Baik, saya akan buka DTO-nya untuk menambahkan validasi / Service-nya untuk mengubah logika bisnisnya."*
2. **Kekuatan Anda ada pada pemahaman konsep.** Reviewer senior lebih menghargai developer yang paham **kenapa** kode itu ditulis seperti itu (alasan transaksi atomik, validasi DTO, soft delete) daripada yang sekadar menghafal sintaksis.

*Semoga sukses untuk sesi belajar dan review teknikal besok!*
