"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";

type DashboardStats = {
  totalTransfers: number;
  totalUsers: number;
  personalUsers: number;
  corporateUsers: number;
  totalTransferValue: number;
  payCurrency: string | null;
  avgKycAuthMinutes: number | null;
  avgKycAuthHours: number | null;
  avgKycAuthDays: number | null;
  kycAuthSampleSize: number;
};

function formatValue(amount: number, currency: string | null) {
  if (!Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}

function formatAuthTime(stats: DashboardStats) {
  if (stats.kycAuthSampleSize === 0) return "—";
  if (stats.avgKycAuthDays != null && stats.avgKycAuthDays >= 1) {
    return `${stats.avgKycAuthDays} day${stats.avgKycAuthDays === 1 ? "" : "s"}`;
  }
  if (stats.avgKycAuthHours != null && stats.avgKycAuthHours >= 1) {
    return `${stats.avgKycAuthHours} hour${stats.avgKycAuthHours === 1 ? "" : "s"}`;
  }
  if (stats.avgKycAuthMinutes != null && stats.avgKycAuthMinutes > 0) {
    return `${stats.avgKycAuthMinutes} min${stats.avgKycAuthMinutes === 1 ? "" : "s"}`;
  }
  return "< 1 min";
}

function StatCard({
  title,
  value,
  subtext,
  icon,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {subtext ? (
            <p className="mt-1 text-xs text-slate-500">{subtext}</p>
          ) : null}
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setStats((data?.data?.stats as DashboardStats) ?? null);
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">
          Flex Money admin console overview
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total transfers"
          value={loading ? "…" : String(stats?.totalTransfers ?? 0)}
          subtext="Non-draft outbound transfers"
          icon={<ArrowLeftRight className="w-5 h-5" />}
        />
        <StatCard
          title="Users"
          value={loading ? "…" : String(stats?.totalUsers ?? 0)}
          subtext={
            loading
              ? undefined
              : `Personal: ${stats?.personalUsers ?? 0} · Corporate: ${stats?.corporateUsers ?? 0}`
          }
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Transaction value"
          value={
            loading
              ? "…"
              : formatValue(
                  stats?.totalTransferValue ?? 0,
                  stats?.payCurrency ?? null,
                )
          }
          subtext="Sum of pay amounts"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Avg. KYC authorisation"
          value={loading || !stats ? "…" : formatAuthTime(stats)}
          subtext={
            loading || !stats
              ? undefined
              : stats.kycAuthSampleSize > 0
                ? `Based on ${stats.kycAuthSampleSize} approved users`
                : "No approved KYC history yet"
          }
          icon={<Clock className="w-5 h-5" />}
        />
      </div>
    </div>
  );
}
