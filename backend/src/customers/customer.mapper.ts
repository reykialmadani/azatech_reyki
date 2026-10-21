import type { Customer, Gender } from '../generated/prisma/client.js';

export interface CustomerResponse {
  id: string;
  customer_name: string;
  customer_address: string;
  gender: Gender;
  birth_date: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Kolom DATE disimpan sebagai tengah malam UTC → ambil bagian tanggalnya saja. */
export const toIsoDateOnly = (date: Date): string => date.toISOString().slice(0, 10);
export const fromIsoDateOnly = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);

export const toCustomerResponse = (customer: Customer): CustomerResponse => ({
  id: customer.id,
  customer_name: customer.customerName,
  customer_address: customer.customerAddress,
  gender: customer.gender,
  birth_date: toIsoDateOnly(customer.birthDate),
  phone: customer.phone,
  created_at: customer.createdAt,
  updated_at: customer.updatedAt,
});
