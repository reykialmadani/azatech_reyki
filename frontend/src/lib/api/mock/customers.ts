import type { ApiFieldErrors } from "@/types/api";
import { GENDERS, type Customer, type CustomerPayload } from "@/types/customer";
import { customers, nowIso } from "./db";
import { fail, noContent, ok, paginate, type MockRoute } from "./router";

const active = () => customers.filter((c) => c.deleted_at === null);
const findActive = (id: string) => active().find((c) => c.id === id);
const strip = (row: (typeof customers)[number]): Customer => {
  const customer: Partial<typeof row> = { ...row };
  delete customer.deleted_at;
  return customer as Customer;
};

function validate(body: Partial<CustomerPayload>): ApiFieldErrors | null {
  const errors: ApiFieldErrors = {};
  if (!body.customer_name?.trim()) errors.customer_name = ["Nama pelanggan wajib diisi"];
  if (!body.customer_address?.trim()) errors.customer_address = ["Alamat wajib diisi"];
  if (!body.gender || !GENDERS.includes(body.gender)) errors.gender = ["Jenis kelamin harus Pria atau Wanita"];
  if (!body.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.birth_date)) {
    errors.birth_date = ["Tanggal lahir tidak valid"];
  }
  return Object.keys(errors).length ? errors : null;
}

const normalize = (payload: CustomerPayload) => ({
  customer_name: payload.customer_name.trim(),
  customer_address: payload.customer_address.trim(),
  gender: payload.gender,
  birth_date: payload.birth_date,
  phone: payload.phone?.trim() || null,
});

export const customerRoutes: MockRoute[] = [
  {
    method: "GET",
    pattern: "/customers",
    handler: ({ query }) => {
      const search = (query.get("search") ?? "").toLowerCase();
      const rows = active()
        .filter(
          (c) =>
            !search ||
            c.customer_name.toLowerCase().includes(search) ||
            (c.phone ?? "").includes(search),
        )
        .sort((a, b) => a.customer_name.localeCompare(b.customer_name))
        .map(strip);
      return paginate(rows, query);
    },
  },
  {
    method: "GET",
    pattern: "/customers/:id",
    handler: ({ params }) => {
      const customer = findActive(params.id!);
      return customer ? ok(strip(customer)) : fail(404, "Pelanggan tidak ditemukan");
    },
  },
  {
    method: "POST",
    pattern: "/customers",
    handler: ({ body }) => {
      const payload = body as CustomerPayload;
      const errors = validate(payload);
      if (errors) return fail(422, "Data tidak valid", errors);
      const now = nowIso();
      const customer = {
        id: crypto.randomUUID(),
        ...normalize(payload),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      customers.push(customer);
      return ok(strip(customer), 201, "Pelanggan berhasil dibuat");
    },
  },
  {
    method: "PUT",
    pattern: "/customers/:id",
    handler: ({ params, body }) => {
      const customer = findActive(params.id!);
      if (!customer) return fail(404, "Pelanggan tidak ditemukan");
      const payload = body as CustomerPayload;
      const errors = validate(payload);
      if (errors) return fail(422, "Data tidak valid", errors);
      Object.assign(customer, normalize(payload), { updated_at: nowIso() });
      return ok(strip(customer), 200, "Pelanggan berhasil diperbarui");
    },
  },
  {
    method: "DELETE",
    pattern: "/customers/:id",
    handler: ({ params }) => {
      const customer = findActive(params.id!);
      if (!customer) return fail(404, "Pelanggan tidak ditemukan");
      customer.deleted_at = nowIso();
      return noContent();
    },
  },
];
