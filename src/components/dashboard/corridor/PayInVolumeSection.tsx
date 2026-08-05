"use client";

import { useMemo, useState } from "react";
import type { PayInByCurrencyItem } from "@/lib/corridor-dashboard-types";
import { fmtLocal, fmtUsd } from "@/lib/corridor-dashboard-format";
import { AdminCountryFlag } from "@/components/country/AdminCountryFlag";
import { DashboardToggle } from "./DashboardToggle";

type PayInVolumeSectionProps = {
  items: PayInByCurrencyItem[];
  loading?: boolean;
};

export function PayInVolumeSection({ items, loading }: PayInVolumeSectionProps) {
  const [mode, setMode] = useState<"local" | "usd">("local");

  const maxValue = useMemo(() => {
    if (items.length === 0) return 1;
    return Math.max(
      ...items.map((i) => (mode === "local" ? i.localVolume : i.usdVolume)),
      1,
    );
  }, [items, mode]);

  return (
    <section className="mb-11">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#c81e3a]">
            Pay-in
          </div>
          <h2 className="font-display text-[19px] font-semibold text-[#221c1a]">
            Volume by source country & currency
          </h2>
        </div>
        <DashboardToggle
          options={[
            { id: "local", label: "Local currency" },
            { id: "usd", label: "USD equivalent" },
          ]}
          value={mode}
          onChange={(v) => setMode(v as "local" | "usd")}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-[14px] bg-[#f3f1ef]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#e4e0db] bg-white px-6 py-12 text-center text-sm text-[#6b6560]">
          No pay-in volume recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const primaryFmt =
              mode === "local"
                ? fmtLocal(item.localVolume, item.currency)
                : fmtUsd(item.usdVolume);
            const secondary =
              mode === "local" ? item.usdVolume : item.localVolume;
            const localPct = (item.localVolume / maxValue) * 100;
            const usdPct = (item.usdVolume / maxValue) * 100;

            return (
              <div
                key={item.currency}
                className="flex flex-col rounded-[14px] border border-[#e4e0db] bg-white p-5 shadow-[0_1px_2px_rgba(34,28,26,0.04),0_8px_20px_-12px_rgba(34,28,26,0.08)]"
              >
                <div className="flex items-center gap-2">
                  {item.countryIso2 ? (
                    <AdminCountryFlag couCode={item.countryIso2} size="md" />
                  ) : (
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#f3f1ef] text-xs">
                      💱
                    </span>
                  )}
                  <div>
                    <div className="font-display text-[15px] font-semibold text-[#221c1a]">
                      {item.countryName ?? item.currency}
                    </div>
                    <div className="font-mono text-[11px] text-[#9a938c]">
                      {item.currency}
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 font-mono text-[21px] font-semibold text-[#221c1a]">
                  <span className="mb-0.5 block text-[11px] font-medium text-[#9a938c]">
                    {mode === "local" ? "Local" : "USD equiv."}
                  </span>
                  {primaryFmt}
                </div>
                <div className="mt-4 flex h-24 items-end gap-2.5">
                  <div className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1.5 whitespace-nowrap font-mono text-[10px] text-[#6b6560]">
                      {fmtLocal(item.localVolume, item.currency)}
                    </span>
                    <div
                      className="w-full max-w-[34px] rounded-t-md bg-gradient-to-t from-[#c81e3a] to-[#d94357]"
                      style={{ height: `${Math.max(localPct, 4)}%` }}
                    />
                    <span className="mt-1.5 text-[9.5px] uppercase tracking-[0.04em] text-[#9a938c]">
                      Local
                    </span>
                  </div>
                  <div className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="mb-1.5 whitespace-nowrap font-mono text-[10px] text-[#6b6560]">
                      {fmtUsd(item.usdVolume)}
                    </span>
                    <div
                      className="w-full max-w-[34px] rounded-t-md bg-gradient-to-t from-[#c9821f] to-[#f3c374]"
                      style={{ height: `${Math.max(usdPct, 4)}%` }}
                    />
                    <span className="mt-1.5 text-[9.5px] uppercase tracking-[0.04em] text-[#9a938c]">
                      USD
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-[10px] text-[#9a938c]">
                  {item.transferCount} transfer{item.transferCount === 1 ? "" : "s"}
                  {mode === "local" && secondary > 0
                    ? ` · ≈ ${fmtUsd(secondary)}`
                    : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
