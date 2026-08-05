"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CorridorMatrix } from "@/lib/corridor-dashboard-types";
import {
  colorForIndex,
  fmtUsd,
  fmtPercent,
  fmtLocal,
} from "@/lib/corridor-dashboard-format";
import { DashboardToggle } from "./DashboardToggle";

function cellChartVolume(cell: {
  usdVolume: number;
  localPayVolume: number;
}): number {
  return cell.usdVolume > 0 ? cell.usdVolume : cell.localPayVolume;
}

function formatCellVolume(
  cell: { usdVolume: number; localPayVolume: number },
  currency: string,
): string {
  if (cell.usdVolume > 0) return fmtUsd(cell.usdVolume);
  return fmtLocal(cell.localPayVolume, currency);
}

type CorridorAnalyticsSectionProps = {
  matrix: CorridorMatrix;
  loading?: boolean;
};

export function CorridorAnalyticsSection({
  matrix,
  loading,
}: CorridorAnalyticsSectionProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const useUsd = matrix.cells.some((c) => c.usdVolume > 0);

  const chartData = useMemo(() => {
    return matrix.payCurrencies.map((pay) => {
      const row: Record<string, string | number> = { payCurrency: pay };
      for (const recv of matrix.receiveCurrencies) {
        const cell = matrix.cells.find(
          (c) => c.payCurrency === pay && c.receiveCurrency === recv,
        );
        row[recv] = cell ? cellChartVolume(cell) : 0;
      }
      return row;
    });
  }, [matrix]);

  if (loading) {
    return (
      <section className="mb-11">
        <div className="mb-4 h-8 w-64 animate-pulse rounded bg-[#f3f1ef]" />
        <div className="h-96 animate-pulse rounded-[14px] bg-[#f3f1ef]" />
      </section>
    );
  }

  const isEmpty =
    matrix.cells.length === 0 ||
    matrix.cells.every(
      (c) => c.usdVolume <= 0 && c.localPayVolume <= 0,
    );

  return (
    <section className="mb-11">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#c81e3a]">
            Corridor analytics
          </div>
          <h2 className="font-display text-[19px] font-semibold text-[#221c1a]">
            Pay-in currency → payout currency split (USD)
          </h2>
        </div>
        <DashboardToggle
          options={[
            { id: "chart", label: "Stacked chart" },
            { id: "table", label: "Table" },
          ]}
          value={view}
          onChange={(v) => setView(v as "chart" | "table")}
        />
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-[#e4e0db] bg-white p-6 shadow-[0_1px_2px_rgba(34,28,26,0.04),0_8px_20px_-12px_rgba(34,28,26,0.08)]">
        {isEmpty ? (
          <p className="py-16 text-center text-sm text-[#6b6560]">
            No corridor data available yet.
          </p>
        ) : view === "chart" ? (
          <>
            <div className="h-[360px] w-full min-w-[480px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e4e0db" vertical={false} />
                  <XAxis
                    dataKey="payCurrency"
                    tick={{ fontSize: 11, fill: "#6b6560" }}
                    axisLine={{ stroke: "#e4e0db" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9a938c" }}
                    tickFormatter={(v) =>
                      useUsd
                        ? fmtUsd(Number(v))
                        : Number(v).toLocaleString("en-US")
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      useUsd
                        ? fmtUsd(Number(value ?? 0))
                        : Number(value ?? 0).toLocaleString("en-US"),
                      String(name),
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e4e0db",
                      fontSize: 12,
                    }}
                  />
                  {matrix.receiveCurrencies.map((recv, i) => (
                    <Bar
                      key={recv}
                      dataKey={recv}
                      stackId="corridor"
                      fill={colorForIndex(i)}
                      radius={i === matrix.receiveCurrencies.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e4e0db] pt-4">
              {matrix.receiveCurrencies.map((recv, i) => (
                <div key={recv} className="flex items-center gap-1.5 text-[11px] text-[#6b6560]">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: colorForIndex(i) }}
                  />
                  {recv}
                </div>
              ))}
            </div>
          </>
        ) : (
          <table className="w-full min-w-[920px] border-collapse text-center">
            <thead>
              <tr>
                <th className="pb-3 text-left text-[11px] font-semibold text-[#6b6560]" />
                {matrix.receiveCurrencies.map((recv) => (
                  <th key={recv} className="px-1.5 pb-3 text-[11px] font-semibold text-[#6b6560]">
                    {recv}
                  </th>
                ))}
                <th className="px-1.5 pb-3 text-[11px] font-semibold text-[#6b6560]">
                  Row total
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.payCurrencies.map((pay) => {
                const rowTotal = matrix.rowTotals[pay] ?? 0;
                return (
                  <tr key={pay}>
                    <td className="py-2 pr-3 text-left">
                      <span className="font-mono text-xs font-semibold text-[#221c1a]">
                        {pay}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[#9a938c]">
                        {rowTotal > 0 && matrix.cells.some((c) => c.payCurrency === pay && c.usdVolume > 0)
                          ? fmtUsd(rowTotal)
                          : fmtLocal(rowTotal, pay)}
                      </span>
                    </td>
                    {matrix.receiveCurrencies.map((recv) => {
                      const cell = matrix.cells.find(
                        (c) => c.payCurrency === pay && c.receiveCurrency === recv,
                      );
                      const val = cell ? cellChartVolume(cell) : 0;
                      return (
                        <td key={recv} className="p-0.5">
                          <div className="min-w-[78px] rounded-md bg-[#f3f1ef] px-2 py-2 font-mono text-[11px] text-[#221c1a]">
                            <span className="font-semibold">
                              {cell ? formatCellVolume(cell, pay) : "—"}
                            </span>
                            <span className="mt-0.5 block text-[9px] text-[#9a938c]">
                              {fmtPercent(val, rowTotal)} of row
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-1.5 py-2 font-mono text-[11.5px] font-semibold text-[#221c1a]">
                      {matrix.cells.some((c) => c.payCurrency === pay && c.usdVolume > 0)
                        ? fmtUsd(rowTotal)
                        : fmtLocal(rowTotal, pay)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-[#e4e0db]">
                <td className="pt-2.5 text-left text-[11px] font-semibold text-[#6b6560]">
                  Column total
                </td>
                {matrix.receiveCurrencies.map((recv) => (
                  <td
                    key={recv}
                    className="pt-2.5 font-mono text-[11.5px] font-semibold text-[#221c1a]"
                  >
                    {fmtUsd(matrix.colTotals[recv] ?? 0)}
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
