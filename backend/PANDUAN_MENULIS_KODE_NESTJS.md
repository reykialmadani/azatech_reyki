# PANDUAN MENULIS & MEMODIFIKASI KODE NESTJS (DARI NOL)
### Panduan Praktis Khusus Live Coding & Code Walkthrough untuk Pemula

> **Tujuan Dokumen Ini:**  
> Jika Anda belum pernah menulis kode backend sebelumnya, dokumen ini akan mengajarkan Anda **cara membaca sintaks**, **arti simbol unik seperti `@`**, **cara kerja baris per baris (`flow code`)**, dan **template siap pakai** jika besok penguji meminta Anda mengubah atau menambahkan kodingan (*modified code*).

---

## DAFTAR ISI
1. [Misteri Simbol `@` (Apa Itu Decorator?)](#1-misteri-simbol--apa-itu-decorator)
2. [Anatomi & Cara Baca Kode TypeScript (Dasar Banget)](#2-anatomi--cara-baca-kode-typescript)
3. [Alur Eksekusi Kode Baris per Baris (Code Flow)](#3-alur-eksekusi-kode-baris-per-baris-code-flow)
4. [Kamus Template Kode Siap Pakai (Tinggal Contek Saat Live Coding)](#4-kamus-template-kode-siap-pakai)
   - 4.1 Menambah / Mengubah Validasi Form (DTO)
   - 4.2 Menambah Endpoint Baru di Controller
   - 4.3 Menulis Logika Query Database di Service (Prisma)
   - 4.4 Menambahkan Filter / Sorting Baru
5. [Trik Rahasia Menghadapi Live Coding Tanpa Panik](#5-trik-rahasia-menghadapi-live-coding-tanpa-panik)

---

## 1. Misteri Simbol `@` (Apa Itu Decorator?)

Pernahkah Anda melihat kode seperti `@Controller()`, `@Injectable()`, `@Get()`, `@IsNotEmpty()` dan bertanya-tanya: **kenapa harus pakai simbol `@`?**

### Analogi Sederhana: "Stiker Label Sakti"
Bayangkan sebuah kardus polos. Tanpa label, kurir tidak tahu kardus itu isinya apa.  
Tapi jika Anda menempelkan stiker:
- Stiker: `FRAGILE (Jangan Dibanting)`
- Stiker: `ALAMAT: Jl. Sudirman No. 1`

Di NestJS dan TypeScript, **simbol `@` disebut Decorator (Dekorator)**.  
Decorator adalah cara kita **menempelkan stiker instruksi sakti** di atas sebuah class, fungsi, atau variabel agar NestJS tahu tugas khususnya.

```typescript
// Tanpa stiker @, ini cuma class biasa yang tidak berguna
export class ProductsController {}

// DENGAN stiker @Controller, NestJS langsung paham:
// "Oh! Ini adalah pelayan yang menangani URL /api/products!"
@Controller('products')
export class ProductsController {}
```

---

### Kamus Lengkap Dekorator yang Paling Sering Digunakan:

#### 1. Dekorator Penentu Peran (Di atas Class)
| Dekorator | Di Mana Ditaruh? | Apa Fungsinya? |
|---|---|---|
| `@Controller('nama')` | Di atas Class Controller | Memberitahu bahwa class ini menerima request web di URL `/api/nama`. |
| `@Injectable()` | Di atas Class Service | Memberitahu NestJS bahwa class ini adalah "Koki Logika" yang siap dipanggil/disuntikkan ke class lain. |
| `@Module({...})` | Di atas Class Module | Tempat mendaftarkan controller dan service ke dalam sistem. |

#### 2. Dekorator Pintu HTTP (Di atas Fungsi di Controller)
| Dekorator | Kapan Digunakan? | Contoh URL |
|---|---|---|
| `@Get()` | Mengambil data | `GET /api/products` (ambil daftar produk) |
| `@Get(':id')` | Mengambil 1 data spesifik | `GET /api/products/1` (ambil produk ID 1) |
| `@Post()` | Menambah data baru | `POST /api/products` (simpan produk baru) |
| `@Put(':id')` | Mengubah / update data | `PUT /api/products/1` (edit produk ID 1) |
| `@Delete(':id')` | Menghapus data | `DELETE /api/products/1` (hapus produk ID 1) |

#### 3. Dekorator Penangkap Data (Di dalam kurung parameter fungsi Controller)
| Dekorator | Apa Fungsinya? | Contoh Penggunaan |
|---|---|---|
| `@Body()` | Mengambil data JSON yang dikirim client (isi form) | `create(@Body() dto: CreateProductDto)` |
| `@Param('id')` | Mengambil ID yang ada di URL | `findOne(@Param('id') id: number)` |
| `@Query()` | Mengambil filter di URL setelah tanda tanya `?` | `list(@Query() query: ListQueryDto)` |

#### 4. Dekorator Validasi (Di dalam file DTO `*.dto.ts`)
Menggunakan library `class-validator`. Jika data dari user tidak sesuai stiker ini, server **otomatis menolak** dengan error 422:
```typescript
export class CreateProductDto {
  @IsNotEmpty({ message: 'Nama produk wajib diisi' }) // Wajib ada isi
  @IsString()                                         // Wajib berupa teks
  product_name: string;

  @IsNumber()                                         // Wajib berupa angka
  @IsPositive({ message: 'Harga harus lebih dari 0' }) // Harus > 0
  price: number;

  @IsInt()                                            // Harus bilangan bulat (bukan 1.5)
  @Min(0, { message: 'Stok minimal 0' })              // Tidak boleh minus
  @Max(1000)                                          // Maksimal 1000
  stock: number;

  @IsOptional()                                       // Boleh dikosongkan (tidak wajib)
  description?: string;
}
```

---

## 2. Anatomi & Cara Baca Kode TypeScript

Jika Anda melihat kode seperti ini:
```typescript
async findOne(id: number): Promise<Product> {
  const product = await this.prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundException('Produk tidak ditemukan');
  }
  return product;
}
```

Berikut cara membacanya kata demi kata:

1. **`async` & `await` (Tunggu Data):**  
   Database itu letaknya di tempat terpisah (PostgreSQL). Mengambil data butuh waktu beberapa milidetik.  
   - Kata `async` di awal fungsi artinya: *"Fungsi ini butuh waktu untuk bekerja."*  
   - Kata `await` di depan perintah artinya: *"Tolong tunggu sampai database selesai merespon sebelum lanjut ke baris berikutnya."*

2. **`id: number` (Tanda Titik Dua = Penentu Tipe Data):**  
   TypeScript sangat disiplin. Setiap variabel diberi tahu tipenya:
   - `nama: string` ➜ teks `"Budi"`
   - `umur: number` ➜ angka `25`
   - `is_active: boolean` ➜ benar/salah `true / false`
   - `items: OrderItem[]` ➜ kumpulan/daftar array `[ item1, item2 ]`

3. **`constructor(private readonly prisma: PrismaService) {}` (Kabel Penghubung):**  
   Setiap kali Anda melihat `constructor(...)` di dalam Service atau Controller, itu artinya class tersebut sedang **memasang kabel sambungan** ke alat lain.  
   Contoh di atas: Service memasang kabel ke `PrismaService` agar bisa memanggil database lewat perintah `this.prisma`.

4. **`throw new NotFoundException('...')` (Lemparkan Error):**  
   Jika ada kondisi yang salah (misal ID produk tidak ditemukan), kita gunakan kata `throw`. Sistem akan langsung berhenti dan mengembalikan response error HTTP 404 rapi ke browser.

5. **`return product;` (Kirim Balik Hasilnya):**  
   Mengirimkan data hasil olahan ke siapa pun yang memanggil fungsi ini.

---

## 3. Alur Eksekusi Kode Baris per Baris (Code Flow)

Mari kita bedah **kode pembuatan pesanan** di [orders.service.ts](file:///c:/azatech/backend/src/orders/orders.service.ts) agar Anda bisa menjelaskannya dengan sangat fasih saat code walkthrough besok:

```typescript
// 1. Deklarasi fungsi menerima DTO (kertas order) dan userId (siapa admin yg login)
async create(dto: CreateOrderDto, userId: string) {

  // 2. Ubah data item dari request menjadi bentuk sederhana
  const lines = dto.items.map((item, index) => ({
    index,
    productId: item.product_id,
    quantity: item.quantity,
  }));

  // 3. Cek apakah ada barang yang sama ditulis 2 kali di request
  assertNoDuplicateProducts(lines);

  // 4. Buka sesi transaksi database (Satu gagal, SEMUA BATAL / ROLLBACK)
  const order = await this.prisma.$transaction(async (tx) => {

    // 5. Pastikan data customer ada di database dan belum dihapus
    await this.assertActiveCustomer(tx, dto.customer_id);

    // 6. Ambil data produk asli dari database
    const products = await this.findActiveProducts(tx, lines);

    // 7. Kurangi stok produk secara aman (cek apakah stock >= quantity)
    await this.decrementStock(tx, lines, products);

    // 8. Hitung harga di backend (PAKAI HARGA DARI DB, BUKAN DARI CLIENT!)
    const items = lines.map(({ productId, quantity }) => {
      const unitPrice = products.get(productId)!.price;
      return { 
        productId, 
        quantity, 
        unitPrice, 
        subtotal: unitPrice.mul(quantity) // Decimal multiply
      };
    });

    // 9. Jumlahkan semua subtotal untuk mendapatkan total_amount
    const totalAmount = items.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Prisma.Decimal(0),
    );

    // 10. Ambil tanggal hari ini dan minta nomor invoice unik (INV-YYYYMMDD-XXXX)
    const orderDate = new Date();
    const orderNumber = await this.orderNumbers.next(tx, orderDate);

    // 11. Simpan pesanan ke tabel orders dan itemnya ke tabel order_items
    return tx.order.create({
      data: {
        orderNumber,
        orderDate,
        customerId: dto.customer_id,
        createdBy: userId,
        totalAmount,
        items: { create: items },
      },
      include: orderDetailInclude, // Sertakan relasi detailnya
    });
  });

  // 12. Bungkus ke format JSON rapi untuk dikirim ke frontend
  return toOrderDetail(order);
}
```

---

## 4. Kamus Template Kode Siap Pakai (Tinggal Contek)

Jika besok saat live coding penguji meminta Anda mengubah atau menambah kodingan, gunakan contekan di bawah ini:

### 4.1 Menambah / Mengubah Validasi Form (DTO)
File target: `src/<fitur>/dto/*.dto.ts`

**Contoh Kasus 1: "Tolong tambahkan field 'kategori' pada produk (opsional, teks)"**
Cukup buka [product.dto.ts](file:///c:/azatech/backend/src/products/dto/product.dto.ts) dan tambahkan di dalam class:
```typescript
@IsOptional()
@IsString({ message: 'Kategori harus berupa teks' })
@MaxLength(50, { message: 'Kategori maksimal 50 karakter' })
category?: string;
```

**Contoh Kasus 2: "Tolong ubah batas stok tidak boleh lebih dari 500"**
Cari properti `stock: number;` lalu tambahkan `@Max(500)`:
```typescript
@IsInt({ message: 'Stok harus bilangan bulat' })
@Min(0, { message: 'Stok minimal 0' })
@Max(500, { message: 'Stok maksimal 500 unit' }) // <-- Baris baru
stock: number;
```

---

### 4.2 Menambah Endpoint Baru di Controller
File target: `src/<fitur>/*.controller.ts`

**Contoh Kasus: "Tolong buat endpoint GET untuk melihat produk yang stoknya habis (stok = 0)"**
Buka [products.controller.ts](file:///c:/azatech/backend/src/products/products.controller.ts), lalu tambahkan method ini:
```typescript
@Get('out-of-stock')
@ApiOperation({ summary: 'Melihat produk yang stoknya habis' })
getOutOfStock() {
  return this.products.findOutOfStock(); // Panggil fungsi di service
}
```

---

### 4.3 Menulis Logika Query Database di Service (Prisma Cheat Sheet)
File target: `src/<fitur>/*.service.ts`

Berikut 5 pola perintah database Prisma yang paling sering dipakai:

#### A. Mengambil Banyak Data (Filter & Sort):
```typescript
async findOutOfStock() {
  return await this.prisma.product.findMany({
    where: {
      deletedAt: null, // Hanya produk aktif
      stock: 0,        // Stoknya sama dengan 0
    },
    orderBy: {
      productName: 'asc', // Urutkan nama dari A ke Z
    },
  });
}
```

#### B. Mengambil Satu Data Berdasarkan ID:
```typescript
async findOne(id: number) {
  const item = await this.prisma.product.findUnique({
    where: { id },
  });
  if (!item) {
    throw new NotFoundException('Data tidak ditemukan');
  }
  return item;
}
```

#### C. Menyimpan Data Baru:
```typescript
async create(dto: CreateProductDto) {
  return await this.prisma.product.create({
    data: {
      productCode: dto.product_code,
      productName: dto.product_name,
      price: dto.price,
      stock: dto.stock,
    },
  });
}
```

#### D. Mengupdate Data:
```typescript
async updateStock(id: number, newStock: number) {
  return await this.prisma.product.update({
    where: { id },
    data: { stock: newStock },
  });
}
```

#### E. Menghapus Data Secara Lembut (Soft Delete):
```typescript
async remove(id: number) {
  await this.prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() }, // Jangan di-delete permanen, cukup isi tanggalnya
  });
}
```

---

### 4.4 Menambahkan Filter Pencarian Baru (Misal: Filter Produk Berdasarkan Rentang Harga)
1. **Di Query DTO (`src/products/dto/list-products-query.dto.ts`):**
   ```typescript
   @IsOptional()
   @IsNumber()
   @Min(0)
   min_price?: number;
   ```
2. **Di Service (`src/products/products.service.ts`):**
   Cari objek `where` di fungsi `list()`, tambahkan:
   ```typescript
   if (query.min_price !== undefined) {
     where.price = { gte: query.min_price }; // gte = Greater Than or Equal (>=)
   }
   ```

---

## 5. Trik Rahasia Menghadapi Live Coding Tanpa Panik

Jika besok Anda diminta menulis atau memodifikasi kode secara langsung di depan reviewer, lakukan langkah-langkah tenang ini:

1. **Gunakan Fitur Auto-Complete (Ctrl + Spasi):**  
   Anda tidak perlu menghafal semua nama fungsi Prisma atau Decorator!  
   - Ketik `this.prisma.product.` lalu tekan `Ctrl + Spasi`. VS Code akan memunculkan pilihan: `findMany`, `findUnique`, `create`, `update`, `delete`.
   - Ketik `@Is` lalu tekan `Ctrl + Spasi`. VS Code akan menampilkan daftar validator: `@IsString`, `@IsNumber`, `@IsEmail`, dll.

2. **Lihat Garis Merah (Linter):**  
   Jika ada teks yang bergaris bawah merah, jangan takut! Arahkan kursor mouse Anda tepat di atas kata yang bergaris merah. VS Code akan memunculkan kotak penjelasan error-nya dalam bahasa Inggris (misal: *"Cannot find name 'IsNumber'"* artinya Anda lupa meng-import `IsNumber` di bagian paling atas file).

3. **Cara Cepat Auto-Import (Ctrl + Titik):**  
   Jika Anda mengetik nama decorator atau class baru dan muncul garis merah, klik teks tersebut lalu tekan tombol `Ctrl + .` (Control dan Titik). Pilih *"Add import from..."*. VS Code akan otomatis menambahkan baris `import` di baris paling atas tanpa Anda harus ketik manual!

4. **Kombinasi Tombol Wajib:**
   - `Ctrl + S`: Menyimpan file (server otomatis reload).
   - `Ctrl + P`: Mencari file dengan cepat (ketik nama filenya, misal: `orders.service`).
   - `Ctrl + F`: Mencari kata tertentu di dalam file yang sedang dibuka.

5. **Kunci Ketenangan:**  
   Reviewer tidak mengharapkan Anda mengetik secepat kilat. Yang mereka nilai adalah:
   - Apakah Anda tahu **file mana** yang harus dibuka? (Tahu tempatnya).
   - Apakah Anda paham **kenapa** kode itu diubah? (Tahu alasannya).
   - Apakah Anda tenang dan sistematis saat membaca error?

*Pegang panduan ini, buka kodenya sambil Anda coba-coba tekan Ctrl+Spasi, dan Anda akan siap menghadapi sesi besok dengan percaya diri!*
