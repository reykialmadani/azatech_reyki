export const GENDERS = ["Pria", "Wanita"] as const;
export type Gender = (typeof GENDERS)[number];

export interface Customer {
  id: string; // uuid
  customer_name: string;
  customer_address: string;
  gender: Gender;
  birth_date: string; // "1995-02-10"
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayload {
  customer_name: string;
  customer_address: string;
  gender: Gender;
  birth_date: string;
  phone: string | null;
}

export interface CustomerListParams {
  page?: number;
  per_page?: number;
  search?: string;
}
