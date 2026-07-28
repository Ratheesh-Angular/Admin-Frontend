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
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500">Flex Money admin overview</p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          {todayLabel}
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          <div className="lg:col-span-5 p-3 sm:p-4">
            <DashboardMetricPanel title="Users">
              <div className="grid grid-cols-2 gap-0 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <DashboardStatCard
                  compact
                  title="New today"
                  value={String(users?.newToday ?? 0)}
                  subtext="UTC"
                  variant="sky"
                  loading={loading}
                  icon={<UserPlus className="h-4 w-4" />}
                />
                <DashboardStatCard
                  compact
                  title="Approved"
                  value={String(users?.approved ?? 0)}
                  variant="emerald"
                  loading={loading}
                  icon={<UserCheck className="h-4 w-4" />}
                />
                <DashboardStatCard
                  compact
                  title="Pending"
                  value={String(users?.pending ?? 0)}
                  variant="amber"
                  loading={loading}
                  icon={<Clock className="h-4 w-4" />}
                />
                <DashboardStatCard
                  compact
                  title="Rejected"
                  value={String(users?.rejected ?? 0)}
                  variant="rose"
                  loading={loading}
                  icon={<XCircle className="h-4 w-4" />}
                />
              </div>
            </DashboardMetricPanel>
          </div>

          <div className="lg:col-span-7 p-3 sm:p-4">
            <DashboardMetricPanel title="Platform">
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
                <DashboardStatCard
                  compact
                  title="Total users"
                  value={String(stats?.totalUsers ?? 0)}
                  subtext={
                    loading
                      ? undefined
                      : `${stats?.personalUsers ?? 0} personal · ${stats?.corporateUsers ?? 0} corporate`
                  }
                  variant="indigo"
                  loading={loading}
                  icon={<Users className="h-4 w-4" />}
                />
                <DashboardStatCard
                  compact
                  title="Volume"
                  value={
                    loading
                      ? "—"
                      : formatValue(
                          stats?.totalTransferValue ?? 0,
                          stats?.payCurrency ?? null,
                        )
                  }
                  subtext="Pay amounts"
                  variant="violet"
                  loading={loading}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <DashboardStatCard
                  compact
                  title="Avg KYC time"
                  value={loading || !stats ? "—" : formatAuthTime(stats)}
                  subtext={
                    loading || !stats
                      ? undefined
                      : stats.kycAuthSampleSize > 0
                        ? `${stats.kycAuthSampleSize} samples`
                        : "No history"
                  }
                  variant="slate"
                  loading={loading}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>
            </DashboardMetricPanel>
          </div>
        </div>

        <div className="border-t border-slate-100 px-3 py-3 sm:px-4 sm:py-3.5">
          <DashboardMetricPanel title="Transactions">
            <div className="grid grid-cols-2 gap-0 sm:grid-cols-3 lg:grid-cols-5">
              <DashboardStatCard
                compact
                title="Total"
                value={String(tx?.total ?? stats?.totalTransfers ?? 0)}
                // subtext="Non-draft"
                variant="indigo"
                loading={loading}
                icon={<ArrowLeftRight className="h-4 w-4" />}
              />
              <DashboardStatCard
                compact
                title="Pending"
                value={String(tx?.pending ?? 0)}
                variant="amber"
                loading={loading}
                icon={<Clock className="h-4 w-4" />}
              />
              <DashboardStatCard
                compact
                title="Processing"
                value={String(tx?.processing ?? 0)}
                variant="sky"
                loading={loading}
                icon={<Loader2 className="h-4 w-4" />}
              />
              <DashboardStatCard
                compact
                title="Completed"
                value={String(tx?.completed ?? 0)}
                variant="emerald"
                loading={loading}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <DashboardStatCard
                compact
                title="Failed"
                value={String(tx?.failed ?? 0)}
                variant="rose"
                loading={loading}
                icon={<XCircle className="h-4 w-4" />}
              />
            </div>
          </DashboardMetricPanel>
        </div>
      </div>

      <DashboardChartsPlaceholder />
    </div>
  );
}
