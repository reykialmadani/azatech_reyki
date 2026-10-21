// Data dummy in-memory untuk mode mock. Hilang saat halaman di-reload penuh.
import type { User } from "@/types/auth";
import type { Customer, Gender } from "@/types/customer";
import type { OrderDetail } from "@/types/order";
import type { Product } from "@/types/product";

export const MOCK_CREDENTIALS = {
  email: "admin@azatech.id",
  password: "password",
};

export const mockUser: User = {
  id: "8c1f3a52-0d6e-4b7a-9a51-3f2c1d7e9b10",
  name: "Admin AZA",
  email: MOCK_CREDENTIALS.email,
};

export const nowIso = () => new Date().toISOString();

export type Archivable<T> = T & { deleted_at: string | null };

// [nama, gender, tgl lahir, no. HP, alamat]
const CUSTOMER_SEED: [string, Gender, string, string | null, string][] = [
  ["Budi Santoso", "Pria", "1995-02-10", "081234567890", "Jakarta Selatan"],
  ["Siti Rahmawati", "Wanita", "1992-07-21", "081398765432", "Bandung"],
  ["Andi Pratama", "Pria", "1988-11-03", null, "Surabaya"],
  ["Dewi Lestari", "Wanita", "1999-04-15", "085712345678", "Yogyakarta"],
  ["Rizky Hidayat", "Pria", "2001-01-30", "082145678901", "Bekasi"],
  ["Putri Ayuningtyas", "Wanita", "1997-09-09", "081256781234", "Depok"],
  ["Agus Setiawan", "Pria", "1985-06-12", "087812349876", "Tangerang"],
  ["Nur Aini", "Wanita", "1994-12-25", null, "Bogor"],
  ["Fajar Nugroho", "Pria", "1990-03-18", "081311122233", "Semarang"],
  ["Maya Sari", "Wanita", "1996-08-02", "085233344455", "Malang"],
  ["Hendra Wijaya", "Pria", "1983-10-27", "081988877766", "Medan"],
  ["Rina Marlina", "Wanita", "2000-05-05", "089612341234", "Palembang"],
  ["Yoga Permana", "Pria", "1998-02-14", null, "Denpasar"],
  ["Indah Permatasari", "Wanita", "1993-11-19", "081577788899", "Makassar"],
  ["Dimas Saputra", "Pria", "2002-07-07", "082233445566", "Solo"],
];

export const customers: Archivable<Customer>[] = CUSTOMER_SEED.map(
  ([name, gender, birthDate, phone, address], i) => {
    const created = new Date(Date.now() - (45 - i) * 86_400_000).toISOString();
    return {
      id: `c0a80121-7ac0-4e1c-9d5e-${String(i + 1).padStart(12, "0")}`,
      customer_name: name,
      customer_address: address,
      gender,
      birth_date: birthDate,
      phone,
      created_at: created,
      updated_at: created,
      deleted_at: null,
    };
  },
);

// [nama, harga, stok, punya gambar?]
const PRODUCT_SEED: [string, number, number, boolean][] = [
  ["Hydrococo 150ml", 12000, 10, true],
  ["Teh Botol Sosro 250ml", 8000, 3, true],
  ["Aqua 600ml", 5000, 48, true],
  ["Pocari Sweat 500ml", 9500, 22, false],
  ["Indomie Goreng", 3500, 120, true],
  ["Chitato Sapi Panggang 68g", 11500, 4, false],
  ["Good Day Cappuccino 250ml", 7000, 0, true],
  ["Ultra Milk Coklat 250ml", 6500, 35, false],
  ["Silverqueen Almond 62g", 17500, 2, true],
  ["Oreo Vanilla 133g", 9000, 16, false],
  ["Teh Pucuk Harum 350ml", 4000, 60, true],
  ["Fruit Tea Blackcurrant 500ml", 6000, 1, false],
  ["Coca-Cola 390ml", 7500, 28, true],
  ["Sprite 390ml", 7500, 12, false],
  ["Kopi Kapal Api Special Mix", 2000, 85, false],
  ["Roti Sari Roti Coklat", 6000, 7, true],
  ["Beng-Beng 20g", 2500, 70, false],
  ["Qtela Singkong Balado 185g", 14000, 9, false],
  ["Yakult 5x65ml", 11000, 0, true],
  ["Le Minerale 600ml", 4500, 54, false],
  ["Nescafe Original Can 240ml", 9000, 13, true],
  ["Taro Net Seaweed 65g", 8500, 3, false],
  ["Mizone Lychee Lemon 500ml", 6500, 19, false],
  ["Cimory Yogurt Strawberry 250ml", 13500, 6, true],
];

export const products: Archivable<Product>[] =PRODUCT_SEED.map(
  ([name, price, stock, hasImage], i) => {
    const code = `P${String(i + 1).padStart(4, "0")}`;
    const created = new Date(Date.now() - (60 - i) * 86_400_000).toISOString();
    return {
      id: i + 1,
      product_code: code,
      product_name: name,
      image_url: hasImage ? `https://picsum.photos/seed/${code}/96` : null,
      stock,
      price: price.toFixed(2),
      created_at: created,
      updated_at: created,
      deleted_at: null,
    };
  },
);

// Riwayat order disimpan lengkap beserta item (snapshot harga).
export const orders: OrderDetail[] = [];

// Counter nomor order per tanggal, meniru tabel order_counters di backend.
const orderCounters = new Map<string, number>();

export function nextOrderNumber(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const seq = (orderCounters.get(key) ?? 0) + 1;
  orderCounters.set(key, seq);
  return `INV-${key}-${String(seq).padStart(4, "0")}`;
}

// Seed 30 order historis dalam 30 hari terakhir (deterministik, tidak memotong stok).
function seedOrders() {
  let state = 42;
  const rand = (max: number) => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    // Pakai bit atas: bit bawah LCG modulus 2^n berulang dengan periode pendek.
    return Math.floor((state / 2_147_483_648) * max);
  };

  const dates = Array.from({ length: 30 }, () => {
    const d = new Date();
    d.setDate(d.getDate() - rand(30));
    d.setHours(8 + rand(12), rand(60), 0, 0);
    return d;
  }).sort((a, b) => a.getTime() - b.getTime());

  let itemId = 0;
  dates.forEach((date, i) => {
    const customer = customers[rand(customers.length)]!;
    const picked = new Set<number>();
    const lineCount = 1 + rand(4);
    while (picked.size < lineCount) picked.add(rand(products.length));

    const items = [...picked].map((idx) => {
      const p = products[idx]!;
      const quantity = 1 + rand(5);
      const unitPrice = Number(p.price);
      return {
        id: ++itemId,
        product_id: p.id,
        quantity,
        unit_price: unitPrice.toFixed(2),
        subtotal: (unitPrice * quantity).toFixed(2),
        product: { id: p.id, product_code: p.product_code, product_name: p.product_name, image_url: p.image_url },
      };
    });

    const iso = date.toISOString();
    orders.push({
      id: i + 1,
      order_number: nextOrderNumber(date),
      customer_id: customer.id,
      created_by: mockUser.id,
      order_date: iso,
      total_amount: items.reduce((sum, it) => sum + Number(it.subtotal), 0).toFixed(2),
      created_at: iso,
      updated_at: iso,
      customer: {
        id: customer.id,
        customer_name: customer.customer_name,
        phone: customer.phone,
        customer_address: customer.customer_address,
      },
      user: { id: mockUser.id, name: mockUser.name },
      items_count: items.length,
      items,
    });
  });
}
seedOrders();
