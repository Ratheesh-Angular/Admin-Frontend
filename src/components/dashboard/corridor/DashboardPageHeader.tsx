"use client";

import { fmtDateChip } from "@/lib/corridor-dashboard-format";

type DashboardPageHeaderProps = {
  statsDate?: string;
};

export function DashboardPageHeader({ statsDate }: DashboardPageHeaderProps) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c81e3a] to-[#8f1626] font-display text-base font-bold text-white shadow-[0_6px_18px_rgba(215,38,61,0.35)]">
          FM
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#221c1a]">
            Corridor Ledger
          </h1>
          <p className="mt-0.5 text-sm text-[#6b6560]">
            Flex Money — multi-country pay-in / payout currency overview
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-[#e4e0db] bg-[#f3f1ef] px-3.5 py-2 font-mono text-xs text-[#6b6560]">
        {fmtDateChip(statsDate)}
      </div>
    </header>
  );
}
