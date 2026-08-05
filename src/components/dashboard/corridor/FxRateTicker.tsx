"use client";

import type { FxTickerItem } from "@/lib/corridor-dashboard-types";

type FxRateTickerProps = {
  items: FxTickerItem[];
  loading?: boolean;
};

export function FxRateTicker({ items, loading }: FxRateTickerProps) {
  if (loading) {
    return (
      <div className="overflow-hidden border-b border-[#e4e0db] bg-white">
        <div className="h-9 animate-pulse bg-[#f3f1ef]" />
      </div>
    );
  }

  if (items.length === 0) return null;

  const tickHtml = items.map((r) => {
    const arrow =
      r.direction === "up" ? "▲" : r.direction === "down" ? "▼" : "·";
    const cls =
      r.direction === "up"
        ? "text-[#1f9d63]"
        : r.direction === "down"
          ? "text-[#d94357]"
          : "text-[#9a938c]";
    const formatted = r.rate.toLocaleString("en-US", {
      maximumFractionDigits: r.rate < 10 ? 4 : 2,
    });
    return (
      <span
        key={r.pair}
        className="inline-flex items-center gap-1.5 border-r border-[#e4e0db] px-5 font-mono text-xs text-[#6b6560]"
      >
        {r.pair}{" "}
        <b className="font-semibold text-[#221c1a]">{formatted}</b>{" "}
        <span className={cls}>{arrow}</span>
      </span>
    );
  });

  return (
    <div className="relative overflow-hidden border-b border-[#e4e0db] bg-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white to-transparent" />
      <div
        className="flex whitespace-nowrap py-2 hover:[animation-play-state:paused]"
        style={{ animation: "ticker 38s linear infinite" }}
      >
        {[...tickHtml, ...tickHtml]}
      </div>
    </div>
  );
}
