const LOCALE = "en-US";

export function fmtUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtMoney(value: number, currency: string | null): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency ?? ""} ${value.toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`.trim();
  }
}

export function fmtLocal(value: number, currency: string): string {
  if (!Number.isFinite(value)) return "—";
  return `${currency} ${Math.round(value).toLocaleString(LOCALE)}`;
}

export function fmtCompact(value: number, prefix = ""): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
  return `${prefix}${Math.round(value).toLocaleString(LOCALE)}`;
}

export function fmtPercent(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function fmtStatsDate(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "Today";
  return d.toLocaleDateString(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(iso ? { timeZone: "UTC" } : {}),
  }).toUpperCase();
}

export function fmtDateChip(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "TODAY";
  return d
    .toLocaleDateString(LOCALE, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: iso ? "UTC" : undefined,
    })
    .toUpperCase();
}

export function fmtAuthTime(stats: {
  avgKycAuthDays: number | null;
  avgKycAuthHours: number | null;
  avgKycAuthMinutes: number | null;
  kycAuthSampleSize: number;
}): string {
  if (stats.kycAuthSampleSize === 0) return "—";
  if (stats.avgKycAuthDays != null && stats.avgKycAuthDays >= 1) {
    return `${stats.avgKycAuthDays}d`;
  }
  if (stats.avgKycAuthHours != null && stats.avgKycAuthHours >= 1) {
    return `${stats.avgKycAuthHours}h`;
  }
  if (stats.avgKycAuthMinutes != null && stats.avgKycAuthMinutes > 0) {
    return `${stats.avgKycAuthMinutes}m`;
  }
  return "<1m";
}

export function formatVolumeSummary(
  volumeByCurrency: { currency: string; localVolume: number }[],
): string {
  if (volumeByCurrency.length === 0) return "—";
  if (volumeByCurrency.length === 1) {
    const v = volumeByCurrency[0];
    return fmtMoney(v.localVolume, v.currency);
  }
  return volumeByCurrency
    .slice(0, 3)
    .map((v) => fmtCompact(v.localVolume, `${v.currency} `))
    .join(" · ");
}

export const CORRIDOR_COLORS = [
  "#c81e3a",
  "#d1443c",
  "#da6a3f",
  "#cf8a2f",
  "#c9a53d",
  "#1f9d63",
  "#5b8def",
  "#a78bfa",
  "#0891b2",
  "#64748b",
];

export function colorForIndex(index: number): string {
  return CORRIDOR_COLORS[index % CORRIDOR_COLORS.length];
}

export function lerpColorRamp(count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return ["#c81e3a"];
  const from = [200, 30, 58];
  const to = [232, 199, 138];
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const rgb = from.map((v, j) => Math.round(v + (to[j] - v) * t));
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  });
}
