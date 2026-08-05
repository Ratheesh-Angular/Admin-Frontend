/*
 * Legacy dashboard — preserved for reference. Replaced by CorridorDashboardClient.
 *
"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import {
  DashboardChartsPlaceholder,
  DashboardMetricPanel,
  DashboardStatCard,
} from "./DashboardStatCard";
import {
  enrichDashboardStats,
  type DashboardStatsPayload,
  type EnrichedDashboardStats,
} from "@/lib/dashboard-stats";

type DashboardStats = EnrichedDashboardStats;

const DASHBOARD_DATE_LOCALE = "en-US";

function formatStatsDate(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "Today";
  return d.toLocaleDateString(DASHBOARD_DATE_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(iso ? { timeZone: "UTC" } : {}),
  });
}

function formatValue(amount: number, currency: string | null) {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat(DASHBOARD_DATE_LOCALE, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString(DASHBOARD_DATE_LOCALE, {
      maximumFractionDigits: 0,
    });
  }
}

function formatAuthTime(stats: DashboardStats) {
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

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/dashboard/stats", {
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setError(data?.error || data?.message || "Failed to load stats.");
          }
          return;
        }
        if (!cancelled) {
          const raw = (data?.data?.stats as DashboardStatsPayload) ?? null;
          setStats(raw ? await enrichDashboardStats(raw) : null);
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

  useEffect(() => {
    setTodayLabel(formatStatsDate(stats?.statsDate));
  }, [stats?.statsDate]);

  const tx = stats?.transactionCounts;
  const users = stats?.userCounts;

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      ... legacy layout ...
    </div>
  );
}
*/

export { default } from "./corridor/CorridorDashboardClient";
