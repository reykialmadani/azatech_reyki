import { format } from "date-fns";
import { z } from "zod";
import { GENDERS, type Customer, type CustomerPayload } from "@/types/customer";

const today = () => format(new Date(), "yyyy-MM-dd");

export const customerSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(1, "Nama pelanggan wajib diisi")
    .max(150, "Maksimal 150 karakter"),
  customer_address: z
    .string()
    .trim()
    .min(1, "Alamat wajib diisi")
    .max(255, "Maksimal 255 karakter"),
  gender: z.enum(GENDERS, { error: "Pilih jenis kelamin" }),
  birth_date: z
    .string()
    .min(1, "Tanggal lahir wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
    // Format yyyy-MM-dd bisa dibandingkan langsung sebagai string.
    .refine((v) => v <= today(), "Tanggal lahir tidak boleh di masa depan"),
  // Opsional: string kosong berarti tidak punya nomor HP.
  phone: z
    .string()
    .trim()
    .max(20, "Maksimal 20 karakter")
    .refine((v) => v === "" || /^(\+62|62|0)8\d{7,12}$/.test(v), "Format nomor HP tidak valid (contoh: 081234567890)"),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const customerFormDefaults = (customer?: Customer): Partial<CustomerFormValues> => ({
  customer_name: customer?.customer_name ?? "",
  customer_address: customer?.customer_address ?? "",
  gender: customer?.gender,
  // Backend bisa mengirim "1995-02-10" atau ISO lengkap; input date butuh yyyy-MM-dd.
  birth_date: customer?.birth_date.slice(0, 10) ?? "",
  phone: customer?.phone ?? "",
});

export const toCustomerPayload = (values: CustomerFormValues): CustomerPayload => ({
  customer_name: values.customer_name,
  customer_address: values.customer_address,
  gender: values.gender,
  birth_date: values.birth_date,
  phone: values.phone || null,
});
