"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PayoutTopCurrencyItem } from "@/lib/corridor-dashboard-types";
import {
  fmtCompact,
  fmtUsd,
  lerpColorRamp,
} from "@/lib/corridor-dashboard-format";
import { AdminCountryFlag } from "@/components/country/AdminCountryFlag";

type PayoutCurrenciesSectionProps = {
  items: PayoutTopCurrencyItem[];
  loading?: boolean;
};

export function PayoutCurrenciesSection({
  items,
  loading,
}: PayoutCurrenciesSectionProps) {
  const colors = lerpColorRamp(items.length);
  const useUsd = items.some((i) => i.usdVolume > 0);
  const maxBar = Math.max(...items.map((i) => (useUsd ? i.usdVolume : i.nativeVolume)), 1);

  const chartData = items.map((item) => ({
    currency: item.currency,
    usdVolume: item.usdVolume,
    nativeVolume: item.nativeVolume,
    barHeight: useUsd ? item.usdVolume : item.nativeVolume,
    label: fmtCompact(item.nativeVolume, `${item.currency} `),
    countryIso2: item.countryIso2,
    countryName: item.countryName,
  }));

  if (loading) {
    return (
      <section className="mb-11">
        <div className="mb-4 h-8 w-72 animate-pulse rounded bg-[#f3f1ef]" />
        <div className="h-80 animate-pulse rounded-[14px] bg-[#f3f1ef]" />
      </section>
    );
  }

  return (
    <section className="mb-11">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#c81e3a]">
            Payout
          </div>
          <h2 className="font-display text-[19px] font-semibold text-[#221c1a]">
            Top 10 payout currencies — native value
          </h2>
        </div>
        <p className="max-w-[460px] text-right text-[12.5px] leading-relaxed text-[#6b6560]">
          Bar height is USD-scaled for fair comparison; the figure shown on each
          bar is the actual payout-currency amount.
        </p>
      </div>

      <div className="rounded-[14px] border border-[#e4e0db] bg-white px-6 py-6 shadow-[0_1px_2px_rgba(34,28,26,0.04),0_8px_20px_-12px_rgba(34,28,26,0.08)]">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#6b6560]">
            No payout volume recorded yet.
          </p>
        ) : (
          <div className="h-[340px] w-full min-w-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 24, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e4e0db" vertical={false} />
                <XAxis
                  dataKey="currency"
                  tick={({ x, y, payload }) => {
                    const item = chartData.find((d) => d.currency === payload.value);
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={12}
                          textAnchor="middle"
                          fill="#221c1a"
                          fontSize={12}
                        >
                          {payload.value}
                        </text>
                        {item?.countryIso2 ? (
                          <foreignObject x={-13} y={16} width={26} height={26}>
                            <AdminCountryFlag couCode={item.countryIso2} size={22} />
                          </foreignObject>
                        ) : null}
                      </g>
                    );
                  }}
                  axisLine={{ stroke: "#e4e0db" }}
                  height={48}
                />
                <YAxis
                  domain={[0, maxBar * 1.1]}
                  tick={{ fontSize: 10, fill: "#9a938c" }}
                  tickFormatter={(v) =>
                    useUsd
                      ? fmtUsd(Number(v))
                      : Number(v).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(_v, _n, props) => {
                    const p = props.payload as (typeof chartData)[0];
                    return [
                      useUsd
                        ? `${p.label} (${fmtUsd(p.usdVolume)} USD equiv.)`
                        : p.label,
                      p.currency,
                    ];
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e4e0db",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="barHeight" radius={[6, 6, 3, 3]} maxBarSize={46}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.currency}
                      fill={colors[index] ?? "#c81e3a"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
