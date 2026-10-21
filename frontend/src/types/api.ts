// Envelope standar backend (lihat LOGIKA-FLOW §1).
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Kunci error memakai dot-notation, mis. "items.0.quantity".
export type ApiFieldErrors = Record<string, string[]>;

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: ApiFieldErrors;
}
