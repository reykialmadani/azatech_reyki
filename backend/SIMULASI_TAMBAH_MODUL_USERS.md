# SIMULASI LIVE CODING: MENAMBAHKAN MODUL BARU DARI NOL
### Studi Kasus: Menambahkan Modul Manajemen User (CRUD Admin)

> **Skenario Ujian Besok:**  
> Penguji berkata: *"Aplikasi kita sudah punya tabel `users` untuk login admin, tapi belum ada fitur manajemen admin (CRUD User). Coba Anda tambahkan modul baru agar kita bisa melihat daftar admin dan menambahkan admin baru secara lengkap."*  
> 
> Dokumen ini adalah **panduan langkah demi langkah (step-by-step)** dari membuat folder pertama sampai fitur bisa dites di Swagger browser.

---

## DAFTAR ISI
1. [Peta Mental Alur Kerja (The 6-Step Workflow)](#1-peta-mental-alur-kerja-the-6-step-workflow)
2. [Langkah 1: Periksa Skema Database (`schema.prisma`)](#2-langkah-1-periksa-skema-database-schemaprisma)
3. [Langkah 2: Buat Formulir Validasi Input (DTO)](#3-langkah-2-buat-formulir-validasi-input-dto)
4. [Langkah 3: Buat Dapur Logika Bisnis (`users.service.ts`)](#4-langkah-3-buat-dapur-logika-bisnis-usersservicets)
5. [Langkah 4: Buat Pelayan Pintu HTTP (`users.controller.ts`)](#5-langkah-4-buat-pelayan-pintu-http-userscontrollerts)
6. [Langkah 5: Satukan Komponen di Modul (`users.module.ts`)](#6-langkah-5-satukan-komponen-di-modul-usersmodulets)
7. [Langkah 6: Pasang Kabel ke Modul Induk (`app.module.ts`)](#7-langkah-6-pasang-kabel-ke-modul-induk-appmodulets)
8. [Langkah 7: Tes Hasilnya Langsung di Browser (Swagger UI)](#8-langkah-7-tes-hasilnya-langsung-di-browser-swagger-ui)
9. [Nilai Tambah & Jawaban Emas di Depan Reviewer](#9-nilai-tambah--jawaban-emas-di-depan-reviewer)

---

## 1. Peta Mental Alur Kerja (The 6-Step Workflow)

Untuk membuat modul baru apa pun di NestJS, urutan kerjanya **selalu sama dan konsisten**:

```
[ 1. Cek Database ] ──▶ [ 2. Buat DTO ] ──▶ [ 3. Buat Service ]
                                                   │
[ 6. Pasang ke App ] ◀── [ 5. Buat Module ] ◀── [ 4. Buat Controller ]
```

Kita akan membuat folder baru bernama `src/users/` dengan struktur seperti ini:
```
src/users/
├── dto/
│   ├── create-user.dto.ts   <-- Validasi data saat tambah admin baru
│   └── update-user.dto.ts   <-- Validasi data saat edit admin
├── users.service.ts         <-- Logika database & hashing password (argon2)
├── users.controller.ts      <-- Endpoint URL: GET, POST, PUT, DELETE
└── users.module.ts          <-- Pendaftaran komponen modul
```

---

## 2. Langkah 1: Periksa Skema Database (`schema.prisma`)

Sebelum menulis kode, cek apakah tabelnya sudah ada di [prisma/schema.prisma](file:///c:/azatech/backend/prisma/schema.prisma):
```prisma
model User {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(150)
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]
  @@map("users")
}
```
*Tabel `User` sudah ada di database kita! Jadi kita TIDAK perlu migrasi database baru. Kita bisa langsung lanjut membuat kodenya.*

---

## 3. Langkah 2: Buat Formulir Validasi Input (DTO)

Buat folder baru: `src/users/dto/`  
Lalu buat file: `src/users/dto/create-user.dto.ts`

### File: `src/users/dto/create-user.dto.ts`
```typescript
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Nama harus berupa teks' })
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @MaxLength(150, { message: 'Email maksimal 150 karakter' })
  email: string;

  @IsString({ message: 'Password harus berupa teks' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}
```

### File: `src/users/dto/update-user.dto.ts`
Buat file kedua untuk kebutuhan edit user (password boleh opsional jika tidak ingin diubah):
```typescript
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
```

---

## 4. Langkah 3: Buat Dapur Logika Bisnis (`users.service.ts`)

Buat file baru: `src/users/users.service.ts`

> **Aturan Keamanan Emas Developer Senior:**  
> 1. Password **WAJIB di-hash** menggunakan library `argon2` sebelum disimpan ke database!
> 2. Saat mengambil list user atau detail user, kolom `password` **JANGAN PERNAH** dikembalikan ke response client!

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

// Kolom yang aman dikirim ke frontend (tanpa password!)
const userSelectFields = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Ambil semua admin
  async list() {
    return await this.prisma.user.findMany({
      select: userSelectFields,
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Ambil 1 admin berdasarkan ID
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelectFields,
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  // 3. Tambah admin baru
  async create(dto: CreateUserDto) {
    // Cek apakah email sudah terdaftar
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah digunakan oleh user lain');
    }

    // Hash password dengan argon2
    const hashedPassword = await argon2.hash(dto.password);

    // Simpan ke database
    return await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
      select: userSelectFields, // Kembalikan tanpa password
    });
  }

  // 4. Update admin
  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Pastikan user ada

    // Jika ganti email, pastikan email baru belum dipakai orang lain
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email sudah digunakan oleh user lain');
      }
    }

    // Siapkan data yang mau diubah
    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.email) dataToUpdate.email = dto.email;
    if (dto.password) {
      dataToUpdate.password = await argon2.hash(dto.password);
    }

    return await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: userSelectFields,
    });
  }

  // 5. Hapus admin
  async remove(id: string) {
    await this.findOne(id); // Pastikan user ada
    await this.prisma.user.delete({ where: { id } });
  }
}
```

---

## 5. Langkah 4: Buat Pelayan Pintu HTTP (`users.controller.ts`)

Buat file baru: `src/users/users.controller.ts`

Tugas file ini adalah memasang URL route `/api/users` dan menghubungkannya ke `UsersService`.

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { UuidPipe } from '../common/pipes/id.pipes.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')          // Mengelompokkan endpoint di Swagger
@ApiBearerAuth()           // Wajib login dengan Bearer Token
@Controller('users')       // URL awalan: /api/users
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua user / admin' })
  list() {
    return this.users.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail 1 user' })
  findOne(@Param('id', new UuidPipe('User tidak ditemukan')) id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @ResponseMessage('User berhasil dibuat')
  @ApiOperation({ summary: 'Tambah user / admin baru' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Put(':id')
  @ResponseMessage('User berhasil diperbarui')
  @ApiOperation({ summary: 'Edit data user' })
  update(
    @Param('id', new UuidPipe('User tidak ditemukan')) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  @ApiOperation({ summary: 'Hapus user' })
  async remove(@Param('id', new UuidPipe('User tidak ditemukan')) id: string): Promise<void> {
    await this.users.remove(id);
  }
}
```

---

## 6. Langkah 5: Satukan Komponen di Modul (`users.module.ts`)

Buat file baru: `src/users/users.module.ts`

Satukan Controller dan Service yang baru kita buat agar saling kenal:

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Boleh di-export jika modul lain butuh
})
export class UsersModule {}
```

---

## 7. Langkah 6: Pasang Kabel ke Modul Induk (`app.module.ts`)

Buka file yang sudah ada: [src/app.module.ts](file:///c:/azatech/backend/src/app.module.ts)

Tinggal tambahkan `UsersModule` ke dalam array `imports: [...]`:

```typescript
// Tambahkan baris import ini di bagian atas:
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(...),
    ThrottlerModule.forRootAsync(...),
    PrismaModule,
    AuthModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    DashboardModule,
    HealthModule,
    UsersModule, // <--- TAMBAHKAN DI SINI! SELESAI!
  ],
  providers: [...],
})
export class AppModule {}
```

---

## 8. Langkah 7: Tes Hasilnya Langsung di Browser (Swagger UI)

Sekarang simpan semua file (`Ctrl + S`). Backend Anda yang berjalan dengan `pnpm start:dev` akan langsung memuat ulang (*hot-reload*).

1. Buka browser: `http://localhost:3000/api/docs`
2. Di halaman Swagger, Anda akan melihat kelompok baru bernama **`Users`** lengkap dengan tombol:
   - `GET /api/users`
   - `POST /api/users`
   - `GET /api/users/{id}`
   - `PUT /api/users/{id}`
   - `DELETE /api/users/{id}`
3. Klik tombol **Authorize** (gembok di kanan atas) dan masukkan token JWT admin.
4. Klik **`POST /api/users` ➜ Try it out** ➜ Masukkan data nama, email, password ➜ Klik **Execute**.
5. Hasil response akan langsung muncul: `201 Created` dengan pesan *"User berhasil dibuat"*, dan password tidak bocor ke luar!

---

## 9. Nilai Tambah & Jawaban Emas di Depan Reviewer

Jika besok penguji meminta Anda melakukan ini, jelaskan keputusan teknis Anda dengan 3 poin ini (dijamin dapat nilai tinggi):

1. **Tentang Keamanan Password:**  
   > *"Saat membuat user, password di-hash secara asynchronous menggunakan algoritma `argon2` yang sangat tahan terhadap brute-force attack. Dan pada query Prisma, saya menggunakan opsi `select: { id: true, name: true, email: true }` agar hash password tidak pernah bocor ke sisi klien."*
2. **Tentang Validasi Email Duplikat:**  
   > *"Sebelum melakukan `prisma.user.create`, saya memeriksa apakah email sudah dipakai. Jika sudah, saya melempar `ConflictException` (HTTP 409) yang ramah pengguna, bukan membiarkan database melempar crash unhandled error."*
3. **Tentang Validasi UUID:**  
   > *"Pada parameter ID di controller, saya menyematkan `UuidPipe`. Jika klien mengirimkan ID yang formatnya bukan UUID yang valid, request langsung ditolak dengan pesan error yang jelas sebelum menyentuh database."*

---

*Dengan panduan ini, Anda memiliki pegangan nyata jika besok diminta mendemokan atau menambahkan modul baru secara langsung!*
