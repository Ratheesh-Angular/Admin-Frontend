"use client";

import { useEffect, useState } from "react";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";
import {
  enrichDashboardStats,
  fetchKycMetrics,
  type EnrichedDashboardStats,
  type DashboardStatsPayload,
} from "@/lib/dashboard-stats";
import { FxRateTicker } from "./FxRateTicker";
import { DashboardPageHeader } from "./DashboardPageHeader";
import { StatusOverviewGrid } from "./StatusOverviewGrid";
import { PayInVolumeSection } from "./PayInVolumeSection";
import { CorridorAnalyticsSection } from "./CorridorAnalyticsSection";
import { CorridorFlowSection } from "./CorridorFlowSection";
import { PayoutCurrenciesSection } from "./PayoutCurrenciesSection";
import { DashboardFooter } from "./DashboardFooter";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-dashboard",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dashboard",
});

export default function CorridorDashboardClient() {
  const [stats, setStats] = useState<EnrichedDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, kycRes] = await Promise.all([
          fetch("/api/admin/dashboard/stats", { credentials: "same-origin" }),
          fetchKycMetrics(),
        ]);
        const data = await statsRes.json();
        if (!statsRes.ok) {
          if (!cancelled) {
            setError(data?.error || data?.message || "Failed to load stats.");
          }
          return;
        }
        if (!cancelled) {
          const raw = (data?.data?.stats as DashboardStatsPayload) ?? null;
          const enriched = raw ? await enrichDashboardStats(raw) : null;
          if (enriched && kycRes) {
            setStats({
              ...enriched,
              avgKycAuthMinutes: kycRes.avgKycAuthMinutes,
              avgKycAuthHours: kycRes.avgKycAuthHours,
              avgKycAuthDays: kycRes.avgKycAuthDays,
              kycAuthSampleSize: kycRes.kycAuthSampleSize,
            });
          } else {
            setStats(enriched);
          }
        }
      } catch {
        if (!cancelled) setError("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${inter.variable} corridor-dashboard -mx-4 -mt-2 font-[family-name:var(--font-dashboard)] sm:-mx-6 lg:-mx-8`}
    >
      <FxRateTicker items={stats?.fxTicker ?? []} loading={loading} />

      <div
        className="mx-auto max-w-[1360px] px-4 py-8 pb-14 sm:px-8 lg:px-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 12% -10%, rgba(200,30,58,0.05), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(201,130,31,0.05), transparent 55%), #fbfaf9",
        }}
      >
        <DashboardPageHeader statsDate={stats?.statsDate} />

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <StatusOverviewGrid stats={stats} loading={loading} />
        <PayInVolumeSection
          items={stats?.payInByCurrency ?? []}
          loading={loading}
        />
        <CorridorAnalyticsSection
          matrix={
            stats?.corridorMatrix ?? {
              payCurrencies: [],
              receiveCurrencies: [],
              cells: [],
              rowTotals: {},
              colTotals: {},
            }
          }
          loading={loading}
        />
        <CorridorFlowSection
          matrix={
            stats?.corridorMatrix ?? {
              payCurrencies: [],
              receiveCurrencies: [],
              cells: [],
              rowTotals: {},
              colTotals: {},
            }
          }
          loading={loading}
        />
        <PayoutCurrenciesSection
          items={stats?.payoutTopCurrencies ?? []}
          loading={loading}
        />
        <DashboardFooter />
      </div>
    </div>
  );
}
