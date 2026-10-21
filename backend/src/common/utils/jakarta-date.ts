// Seluruh logika "hari" (nomor order harian, filter tanggal, grafik) memakai
// zona Asia/Jakarta (UTC+7, tanpa DST), bukan UTC server.
const TIME_ZONE = 'Asia/Jakarta';
const JAKARTA_OFFSET = '+07:00';
const DAY_MS = 24 * 60 * 60 * 1000;

const isoFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "2026-10-21" — tanggal kalender Jakarta dari sebuah instant. */
export const toJakartaIsoDate = (date: Date): string => isoFormatter.format(date);

/** "20261021" — dipakai untuk nomor order INV-YYYYMMDD-XXXX. */
export const toJakartaDateKey = (date: Date): string =>
  toJakartaIsoDate(date).replaceAll('-', '');

/** Awal hari (00:00 WIB) untuk tanggal "YYYY-MM-DD". */
export const startOfJakartaDay = (isoDate: string): Date =>
  new Date(`${isoDate}T00:00:00${JAKARTA_OFFSET}`);

/** Awal hari berikutnya — dipakai sebagai batas eksklusif (`lt`). */
export const startOfNextJakartaDay = (isoDate: string): Date =>
  new Date(startOfJakartaDay(isoDate).getTime() + DAY_MS);

/** Daftar tanggal "YYYY-MM-DD" untuk `days` hari terakhir, termasuk hari ini. */
export function lastJakartaDates(days: number, now = new Date()): string[] {
  const today = startOfJakartaDay(toJakartaIsoDate(now)).getTime();
  return Array.from({ length: days }, (_, i) =>
    toJakartaIsoDate(new Date(today - (days - 1 - i) * DAY_MS)),
  );
}
