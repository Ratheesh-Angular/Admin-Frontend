"use client";

import type { EnrichedDashboardStats } from "@/lib/corridor-dashboard-types";
import {
  fmtAuthTime,
  formatVolumeSummary,
  fmtPercent,
} from "@/lib/corridor-dashboard-format";
import { StatusDonutPanel } from "./StatusDonutPanel";

type StatusOverviewGridProps = {
  stats: EnrichedDashboardStats | null;
  loading?: boolean;
};

export function StatusOverviewGrid({ stats, loading }: StatusOverviewGridProps) {
  const users = stats?.userCounts;
  const tx = stats?.transactionCounts;
  const totalUsers = stats?.totalUsers ?? 0;
  const totalTx = tx?.total ?? 0;

  const userSegments = [
    { key: "approved", label: "Approved", value: users?.approved ?? 0, color: "#1f9d63" },
    { key: "pending", label: "Pending", value: users?.pending ?? 0, color: "#c9821f" },
    { key: "rejected", label: "Rejected", value: users?.rejected ?? 0, color: "#d94357" },
  ];

  const txSegments = [
    { key: "pending", label: "Pending", value: tx?.pending ?? 0, color: "#c9821f" },
    { key: "processing", label: "Processing", value: tx?.processing ?? 0, color: "#5b8def" },
    { key: "completed", label: "Completed", value: tx?.completed ?? 0, color: "#1f9d63" },
    { key: "failed", label: "Failed", value: tx?.failed ?? 0, color: "#d94357" },
  ];

  return (
    <div className="mb-9 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <StatusDonutPanel
        title="Users"
        subtitle="Onboarding & KYC status"
        badge={loading ? "…" : `+${users?.newToday ?? 0} new today`}
        segments={userSegments}
        centerLabel={String(totalUsers)}
        centerSub="users"
        centerRate={`${fmtPercent(users?.approved ?? 0, totalUsers)} approved`}
        footerTiles={[
          {
            label: "Total users",
            value: String(totalUsers),
            foot: `${stats?.personalUsers ?? 0} personal · ${stats?.corporateUsers ?? 0} corporate`,
          },
          {
            label: "Avg KYC time",
            value: stats ? fmtAuthTime(stats) : "—",
            foot:
              stats && stats.kycAuthSampleSize > 0
                ? `${stats.kycAuthSampleSize} samples`
                : "No history yet",
          },
        ]}
        loading={loading}
      />
      <StatusDonutPanel
        title="Transactions"
        subtitle="Processing pipeline status"
        badge={loading ? "…" : `${totalTx} total`}
        segments={txSegments}
        centerLabel={String(totalTx)}
        centerSub="txns"
        centerRate={`${fmtPercent(tx?.completed ?? 0, totalTx)} completed`}
        footerTiles={[
          {
            label: "Total volume",
            value: stats
              ? formatVolumeSummary(stats.volumeByCurrency)
              : "—",
            foot: "Pay amounts, all corridors",
          },
        ]}
        loading={loading}
      />
    </div>
  );
}
