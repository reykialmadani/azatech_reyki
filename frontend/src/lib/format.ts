import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

// Nilai uang dari backend berupa string desimal; Number() hanya untuk tampilan.
export const formatRupiah = (v: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(Number(v))
    .replace(/ /g, " "); // "Rp 12.000"

// Untuk sumbu grafik: "Rp 1,2 jt", "Rp 500 rb".
export const formatRupiahCompact = (v: number | string) =>
  `Rp ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(Number(v))}`;

// parseISO membaca "1995-02-10" sebagai tanggal lokal (new Date() menganggapnya UTC,
// sehingga bisa mundur sehari di zona waktu negatif).
const toDate = (d: string | Date) => (typeof d === "string" ? parseISO(d) : d);

export const formatTanggal = (d: string | Date) =>
  format(toDate(d), "d MMM yyyy", { locale: id }); // "10 Feb 1995"

// "Admin AZA" -> "AA", "Budi" -> "BU"
export const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? `${words[0]![0]}${words[1]![0]}`
      : (words[0] ?? "").slice(0, 2);
  return initials.toUpperCase();
};

export const formatTanggalWaktu = (d: string | Date) =>
  format(toDate(d), "d MMM yyyy, HH.mm", { locale: id }); // "21 Okt 2026, 14.30"
