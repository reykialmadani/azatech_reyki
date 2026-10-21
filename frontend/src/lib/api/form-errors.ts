import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "./client";

/**
 * Memetakan `errors` dari backend (kunci dot-notation, mis. "items.0.quantity")
 * ke field React Hook Form. Mengembalikan true jika minimal satu field terpetakan,
 * sehingga pemanggil tahu apakah masih perlu menampilkan toast umum.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields?: readonly string[],
): boolean {
  if (!isApiError(error) || !error.errors) return false;

  let mapped = false;
  for (const [field, messages] of Object.entries(error.errors)) {
    if (knownFields && !knownFields.some((f) => field === f || field.startsWith(`${f}.`))) {
      continue;
    }
    const message = messages[0];
    if (!message) continue;
    setError(field as Path<T>, { type: "server", message }, { shouldFocus: !mapped });
    mapped = true;
  }
  return mapped;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan tak terduga";
