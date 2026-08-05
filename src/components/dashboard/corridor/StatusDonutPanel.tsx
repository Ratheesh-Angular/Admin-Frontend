"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { StatusSegment } from "@/lib/corridor-dashboard-types";
import { fmtPercent } from "@/lib/corridor-dashboard-format";

type StatusDonutPanelProps = {
  title: string;
  subtitle: string;
  badge: string;
  segments: StatusSegment[];
  centerLabel: string;
  centerSub: string;
  centerRate: string;
  footerTiles: { label: string; value: string; foot?: string }[];
  loading?: boolean;
};

export function StatusDonutPanel({
  title,
  subtitle,
  badge,
  segments,
  centerLabel,
  centerSub,
  centerRate,
  footerTiles,
  loading,
}: StatusDonutPanelProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const chartData = segments.filter((s) => s.value > 0);

  return (
    <div className="rounded-[14px] border border-[#e4e0db] bg-white p-6 shadow-[0_1px_2px_rgba(34,28,26,0.04),0_8px_20px_-12px_rgba(34,28,26,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#9a938c]">
            {title}
          </div>
          <div className="mt-0.5 text-[11.5px] text-[#6b6560]">{subtitle}</div>
        </div>
        <div className="rounded-md border border-[#e4e0db] bg-[#f3f1ef] px-2.5 py-1 font-mono text-[10.5px] text-[#6b6560]">
          {badge}
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-[#f3f1ef]" />
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.length ? chartData : [{ key: "empty", value: 1, color: "#ece9e6" }]}
                  dataKey="value"
                  innerRadius={48}
                  outerRadius={64}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(chartData.length ? chartData : [{ key: "empty", value: 1, color: "#ece9e6" }]).map(
                    (entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ),
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center">
              <span className="font-mono text-[22px] font-semibold leading-none text-[#221c1a]">
                {centerLabel}
              </span>
              <span className="mt-1 text-[9.5px] uppercase tracking-[0.06em] text-[#9a938c]">
                {centerSub}
              </span>
              <span className="mt-0.5 font-mono text-[10px] text-[#1f9d63]">
                {centerRate}
              </span>
            </div>
          </div>

          <div className="min-w-[190px] flex-1 space-y-2.5">
            {segments.map((seg) => (
              <div key={seg.key} className="flex items-center gap-2.5">
                <span className="flex w-[82px] shrink-0 items-center text-xs text-[#6b6560]">
                  <span
                    className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  {seg.label}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[#f3f1ef]">
                  <div
                    className="h-full rounded-sm transition-all"
                    style={{
                      width: `${total ? (seg.value / total) * 100 : 0}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                </div>
                <span className="w-[74px] shrink-0 text-right font-mono text-xs text-[#221c1a]">
                  {seg.value}
                  <span className="ml-1 text-[10px] text-[#9a938c]">
                    {fmtPercent(seg.value, total)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3.5 border-t border-[#e4e0db] pt-4">
        {footerTiles.map((tile) => (
          <div
            key={tile.label}
            className="min-w-[120px] flex-1 rounded-[10px] bg-[#f3f1ef] px-3.5 py-3"
          >
            <div className="text-[10.5px] text-[#6b6560]">{tile.label}</div>
            <div className="mt-1 font-mono text-[17px] font-semibold text-[#221c1a]">
              {loading ? "—" : tile.value}
            </div>
            {tile.foot ? (
              <div className="mt-0.5 text-[10px] text-[#9a938c]">{tile.foot}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
