"use client";

import { useMemo } from "react";
import type { CorridorMatrix } from "@/lib/corridor-dashboard-types";
import { colorForIndex, fmtLocal, fmtUsd } from "@/lib/corridor-dashboard-format";

type CorridorFlowSectionProps = {
  matrix: CorridorMatrix;
  loading?: boolean;
};

function cellVolume(cell: {
  usdVolume: number;
  localPayVolume: number;
}): number {
  return cell.usdVolume > 0 ? cell.usdVolume : cell.localPayVolume;
}

export function CorridorFlowSection({
  matrix,
  loading,
}: CorridorFlowSectionProps) {
  const useUsd = matrix.cells.some((c) => c.usdVolume > 0);

  const rows = useMemo(() => {
    return matrix.payCurrencies.map((pay) => {
      const rowTotal = matrix.rowTotals[pay] ?? 0;
      const segments = matrix.receiveCurrencies
        .map((recv) => {
          const cell = matrix.cells.find(
            (c) => c.payCurrency === pay && c.receiveCurrency === recv,
          );
          const volume = cell ? cellVolume(cell) : 0;
          return { recv, volume };
        })
        .filter((s) => s.volume > 0)
        .sort((a, b) => b.volume - a.volume);

      const top = segments[0];
      return { pay, rowTotal, segments, top, useUsd };
    });
  }, [matrix, useUsd]);

  const isEmpty =
    matrix.cells.length === 0 ||
    matrix.cells.every(
      (c) => c.usdVolume <= 0 && c.localPayVolume <= 0,
    );

  if (loading) {
    return (
      <section className="mb-11">
        <div className="mb-4 h-8 w-72 animate-pulse rounded bg-[#f3f1ef]" />
        <div className="h-64 animate-pulse rounded-[14px] bg-[#f3f1ef]" />
      </section>
    );
  }

  return (
    <section className="mb-11">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#c81e3a]">
            Corridor flow
          </div>
          <h2 className="font-display text-[19px] font-semibold text-[#221c1a]">
            Pay-in currency → payout currency, at a glance
          </h2>
        </div>
        <p className="max-w-[460px] text-right text-[12.5px] leading-relaxed text-[#6b6560]">
          Each bar is one pay-in currency, sized to 100%; segments show exactly
          what share is paid out in each currency.
        </p>
      </div>

      <div className="rounded-[14px] border border-[#e4e0db] bg-white px-6 py-5 shadow-[0_1px_2px_rgba(34,28,26,0.04),0_8px_20px_-12px_rgba(34,28,26,0.08)]">
        {isEmpty ? (
          <p className="py-12 text-center text-sm text-[#6b6560]">
            No corridor flow data yet.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.pay} className="flex flex-wrap items-center gap-4">
                <div className="w-32 shrink-0">
                  <div className="flex items-center gap-1.5 font-display text-[13.5px] font-semibold text-[#221c1a]">
                    <span className="font-mono text-xs">{row.pay}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] text-[#9a938c]">
                    {useUsd
                      ? `${fmtUsd(row.rowTotal)} total`
                      : `${fmtLocal(row.rowTotal, row.pay)} total`}
                  </div>
                </div>
                <div className="flex h-[34px] min-w-[180px] flex-1 overflow-hidden rounded-lg bg-[#f3f1ef]">
                  {row.segments.map((seg, i) => {
                    const pct = row.rowTotal
                      ? (seg.volume / row.rowTotal) * 100
                      : 0;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={seg.recv}
                        className="flex h-full items-center justify-center transition-[filter] hover:brightness-110"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: colorForIndex(i),
                          minWidth: pct > 0 ? "2px" : 0,
                        }}
                        title={`${seg.recv}: ${useUsd ? fmtUsd(seg.volume) : fmtLocal(seg.volume, row.pay)} (${Math.round(pct)}%)`}
                      >
                        {pct >= 12 ? (
                          <span className="px-1.5 text-[10.5px] font-semibold tracking-wide text-white">
                            {seg.recv}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="w-[150px] shrink-0 text-right text-[11.5px] leading-snug text-[#6b6560]">
                  {row.top ? (
                    <>
                      Top <span className="text-[#9a938c]">→</span>{" "}
                      <b className="font-mono text-[#221c1a]">{row.top.recv}</b>
                      <br />
                      <span className="font-mono text-[10px]">
                        {useUsd
                          ? fmtUsd(row.top.volume)
                          : fmtLocal(row.top.volume, row.pay)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between pl-32 pr-[166px] font-mono text-[9.5px] text-[#9a938c]">
              <span>0%</span>
              <span>50%</span>
              <span>100% of currency&apos;s pay-in volume</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e4e0db] pt-4">
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
          </div>
        )}
      </div>
    </section>
  );
}
