"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatRupiah, formatRupiahCompact, formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailySales } from "@/types/dashboard";

// Satu seri, mengikuti palet monokrom: batang hitam, grid hairline, teks memakai token teks.
const INK = "#09090b";
const INK_HOVER = "#52525b";
const GRID = "#f4f4f5";
const MUTED = "#71717a";

interface Datum {
  date: string;
  label: string;
  total: number;
  transactions: number;
}

export function SalesChart({ data }: { data: DailySales[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const rows: Datum[] = data.map((d) => ({
    date: d.date,
    label: formatTanggal(d.date).replace(/ \d{4}$/, ""), // "21 Okt"
    total: Number(d.total_amount),
    transactions: d.transactions,
  }));
  const periodTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const best = rows.reduce<Datum | null>((top, r) => (!top || r.total > top.total ? r : top), null);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <header className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-zinc-900">Penjualan Harian</h2>
          <p className="text-sm text-zinc-500">
            30 hari terakhir · <span className="font-medium text-zinc-900">{formatRupiah(periodTotal)}</span>
            {best && best.total > 0 && (
              <>
                {" "}· tertinggi {best.label} ({formatRupiahCompact(best.total)})
              </>
            )}
          </p>
        </div>
        <div role="tablist" aria-label="Tampilan data" className="flex self-start rounded-md border border-zinc-200 p-0.5 sm:self-auto">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                view === v ? "bg-black text-white" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {v === "chart" ? "Grafik" : "Tabel"}
            </button>
          ))}
        </div>
      </header>

      {view === "chart" ? (
        <div
          className="h-64 px-2 pt-4 pb-2 sm:h-72"
          role="img"
          aria-label={`Grafik penjualan harian 30 hari terakhir, total ${formatRupiah(periodTotal)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#e4e4e7" }}
                tick={{ fill: MUTED, fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                width={88}
                tickLine={false}
                axisLine={false}
                tick={{ fill: MUTED, fontSize: 11 }}
                tickFormatter={(v: number) => (v === 0 ? "0" : formatRupiahCompact(v))}
                allowDecimals={false}
              />
              <Tooltip cursor={{ fill: GRID }} content={ChartTooltip} isAnimationActive={false} />
              <Bar
                dataKey="total"
                fill={INK}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                activeBar={{ fill: INK_HOVER }}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50">
              <tr>
                <th className="micro-label px-5 py-2.5 text-left">Tanggal</th>
                <th className="micro-label px-5 py-2.5 text-right">Transaksi</th>
                <th className="micro-label px-5 py-2.5 text-right">Penjualan</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.date} className="border-t border-zinc-100">
                  <td className="px-5 py-2 text-zinc-700 tabular-nums">{formatTanggal(r.date)}</td>
                  <td className="px-5 py-2 text-right text-zinc-700 tabular-nums">{r.transactions}</td>
                  <td className="px-5 py-2 text-right font-medium text-zinc-900 tabular-nums">
                    {formatRupiah(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const datum = payload?.[0]?.payload as Datum | undefined;
  if (!active || !datum) return null;
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900 tabular-nums">{formatRupiah(datum.total)}</p>
      <p className="text-xs text-zinc-500">
        {formatTanggal(datum.date)} · {datum.transactions} transaksi
      </p>
    </div>
  );
}
