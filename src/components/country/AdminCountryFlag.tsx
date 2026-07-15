"use client";

import type { CSSProperties } from "react";
import isoCodes from "@/data/iso-codes.json";

const ALPHA3_TO_ALPHA2: Record<string, string> = {};
for (const row of isoCodes as [string, string][]) {
  const [a2, a3] = row;
  if (a2 && a3) ALPHA3_TO_ALPHA2[a3.toUpperCase()] = a2.toUpperCase();
}

export type AdminCountryFlagSize = "sm" | "md" | "lg";

/** Pixel diameter for each preset — use presets across admin UI for consistency. */
export const ADMIN_COUNTRY_FLAG_PX: Record<AdminCountryFlagSize, number> = {
  sm: 22,
  md: 26,
  lg: 30,
};

function alpha2FromCouCode(couCode: string): string | undefined {
  const normalized = couCode.trim().toUpperCase();
  if (normalized.length === 2) return normalized;
  return ALPHA3_TO_ALPHA2[normalized];
}

function resolvePx(size: AdminCountryFlagSize | number): number {
  return typeof size === "number" ? size : ADMIN_COUNTRY_FLAG_PX[size];
}

/** Higher-res flagcdn asset for crisp circles on retina displays. */
function flagImageUrl(alpha2: string, displayPx: number): string {
  const bucket = displayPx <= 24 ? 80 : displayPx <= 36 ? 160 : 320;
  return `https://flagcdn.com/w${bucket}/${alpha2.toLowerCase()}.png`;
}

export type AdminCountryFlagProps = {
  couCode: string;
  /** Preset or exact diameter in px. Default `md` (26px). */
  size?: AdminCountryFlagSize | number;
  /**
   * `default` — light ring for visibility on white backgrounds.
   * `white` — for overlapping currency-pair stacks.
   */
  variant?: "default" | "white";
  /** When true, loads the flag image immediately (for open dropdowns). */
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Standard admin country flag: circular, clearly visible, reusable in
 * selects, tables, chips, and currency-pair displays.
 */
export function AdminCountryFlag({
  couCode,
  size = "md",
  variant = "default",
  eager = false,
  className = "",
  style,
}: AdminCountryFlagProps) {
  const px = resolvePx(size);
  const a2 = alpha2FromCouCode(couCode);

  const ringClass =
    variant === "white"
      ? "ring-2 ring-white shadow-sm"
      : "ring-1 ring-slate-200/90";

  if (a2) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-100 ${ringClass} ${className}`}
        style={{ width: px, height: px, ...style }}
        aria-hidden
      >
        <img
          src={flagImageUrl(a2, px)}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 uppercase ${ringClass} ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: Math.max(8, Math.round(px * 0.32)),
        ...style,
      }}
      aria-hidden
    >
      {couCode.trim().slice(0, 2)}
    </span>
  );
}
