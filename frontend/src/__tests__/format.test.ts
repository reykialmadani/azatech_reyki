import { describe, expect, it } from "vitest";
import { formatRupiah, formatTanggal, formatTanggalWaktu, getInitials } from "@/lib/format";

describe("Format Indonesia", () => {
  it("memformat Rupiah dari string desimal backend", () => {
    expect(formatRupiah("12000.00")).toBe("Rp 12.000");
    expect(formatRupiah(1342500)).toBe("Rp 1.342.500");
  });

  it("memformat tanggal tanpa bergeser hari", () => {
    expect(formatTanggal("1995-02-10")).toBe("10 Feb 1995");
    expect(formatTanggalWaktu(new Date(2026, 9, 21, 14, 30))).toBe("21 Okt 2026, 14.30");
  });

  it("membuat inisial avatar", () => {
    expect(getInitials("Budi Santoso")).toBe("BS");
    expect(getInitials("Admin")).toBe("AD");
  });
});
