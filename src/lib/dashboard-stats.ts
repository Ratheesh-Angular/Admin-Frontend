import type {
  DashboardStatsPayload,
  EnrichedDashboardStats,
  TransactionCounts,
  UserCounts,
} from "./corridor-dashboard-types";
import {
  buildCorridorStatsFromTransfers,
  type CorridorTransferRow,
} from "./corridor-dashboard-aggregate";
import type { OutboundTransferListRow } from "./payments/outbound-transfer-types";

export type {
  DashboardStatsPayload,
  EnrichedDashboardStats,
  TransactionCounts,
  UserCounts,
} from "./corridor-dashboard-types";

type KycUserRow = {
  kycStatus: string;
  createdAt: string;
};

type TransferRow = CorridorTransferRow & Pick<OutboundTransferListRow, "status">;

function startOfUtcDay(iso?: string): Date {
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function buildUserCountsFromRows(
  users: KycUserRow[],
  dayStart: Date,
): UserCounts {
  let newToday = 0;
  let approved = 0;
  let pending = 0;
  let rejected = 0;

  for (const u of users) {
    const created = new Date(u.createdAt);
    if (!Number.isNaN(created.getTime()) && created >= dayStart) newToday += 1;
    if (u.kycStatus === "APPROVED") approved += 1;
    else if (u.kycStatus === "PENDING" || u.kycStatus === "SUBMITTED" || u.kycStatus === "IN_PROGRESS") pending += 1;
    else if (u.kycStatus === "REJECTED") rejected += 1;
  }

  return { newToday, approved, pending, rejected };
}

function buildTransactionCountsFromRows(
  transfers: TransferRow[],
): TransactionCounts {
  let pending = 0;
  let processing = 0;
  let completed = 0;
  let failed = 0;

  for (const t of transfers) {
    if (t.status === "DRAFT") continue;
    if (
      t.status === "PENDING_PAYMENT" ||
      t.status === "PAYMENT_SUBMITTED" ||
      t.status === "UNDER_REVIEW"
    ) {
      pending += 1;
    } else if (t.status === "PROCESSING") {
      processing += 1;
    } else if (t.status === "COMPLETED") {
      completed += 1;
    } else if (t.status === "FAILED" || t.status === "CANCELLED") {
      failed += 1;
    }
  }

  const total = pending + processing + completed + failed;
  return { total, pending, processing, completed, failed };
}

function userCountsLookEmpty(counts: UserCounts | undefined, totalUsers: number) {
  if (!counts) return totalUsers > 0;
  if (totalUsers === 0) return false;
  return (
    counts.newToday === 0 &&
    counts.approved === 0 &&
    counts.pending === 0 &&
    counts.rejected === 0
  );
}

function transactionCountsLookEmpty(
  counts: TransactionCounts | undefined,
  totalTransfers: number,
) {
  if (totalTransfers === 0) return false;
  if (!counts) return true;
  const bucketSum =
    counts.pending + counts.processing + counts.completed + counts.failed;
  return bucketSum === 0;
}

async function fetchUsersForRole(role: "INDIVIDUAL" | "CORPORATE") {
  const res = await fetch(`/api/admin/users?role=${role}`, {
    credentials: "same-origin",
  });
  if (!res.ok) return [] as KycUserRow[];
  const data = await res.json();
  return (data?.data?.users as KycUserRow[]) ?? [];
}

async function fetchTransfersForRole(role: "INDIVIDUAL" | "CORPORATE") {
  const res = await fetch(`/api/admin/transfers?role=${role}`, {
    credentials: "same-origin",
  });
  if (!res.ok) return [] as TransferRow[];
  const data = await res.json();
  return (data?.data?.transfers as TransferRow[]) ?? [];
}

async function fetchAllTransfers(): Promise<TransferRow[]> {
  const [individual, corporate] = await Promise.all([
    fetchTransfersForRole("INDIVIDUAL"),
    fetchTransfersForRole("CORPORATE"),
  ]);
  return [...individual, ...corporate];
}

/** Fill missing dashboard buckets and rebuild corridor stats from outbound transfer lists. */
export async function enrichDashboardStats(
  stats: DashboardStatsPayload,
): Promise<EnrichedDashboardStats> {
  const needsUsers = userCountsLookEmpty(stats.userCounts, stats.totalUsers);
  const needsTx = transactionCountsLookEmpty(
    stats.transactionCounts,
    stats.totalTransfers,
  );

  const transfers = await fetchAllTransfers();
  const corridorFields = buildCorridorStatsFromTransfers(transfers);

  let userCounts = stats.userCounts;
  let transactionCounts = stats.transactionCounts;

  if (needsUsers) {
    const dayStart = startOfUtcDay(stats.statsDate);
    const [individual, corporate] = await Promise.all([
      fetchUsersForRole("INDIVIDUAL"),
      fetchUsersForRole("CORPORATE"),
    ]);
    userCounts = buildUserCountsFromRows([...individual, ...corporate], dayStart);
  }

  if (needsTx) {
    transactionCounts = buildTransactionCountsFromRows(transfers);
  }

  return normalizeEnrichedStats({
    ...stats,
    ...corridorFields,
    userCounts: userCounts ?? {
      newToday: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    },
    transactionCounts: transactionCounts ?? {
      total: stats.totalTransfers,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    },
    totalTransfers: transactionCounts?.total ?? transfers.filter((t) => t.status !== "DRAFT").length,
    payCurrency: corridorFields.volumeByCurrency[0]?.currency ?? stats.payCurrency,
    volumeByCurrency: corridorFields.volumeByCurrency,
  });
}

function normalizeEnrichedStats(
  stats: DashboardStatsPayload & {
    userCounts: UserCounts;
    transactionCounts: TransactionCounts;
  },
): EnrichedDashboardStats {
  return {
    ...stats,
    fxTicker: stats.fxTicker ?? [],
    payInByCurrency: stats.payInByCurrency ?? [],
    corridorMatrix: stats.corridorMatrix ?? {
      payCurrencies: [],
      receiveCurrencies: [],
      cells: [],
      rowTotals: {},
      colTotals: {},
    },
    payoutTopCurrencies: stats.payoutTopCurrencies ?? [],
    volumeByCurrency: stats.volumeByCurrency ?? [],
  };
}

export type KycMetricsPayload = {
  avgKycAuthMinutes: number | null;
  avgKycAuthHours: number | null;
  avgKycAuthDays: number | null;
  kycAuthSampleSize: number;
};

export async function fetchKycMetrics(): Promise<KycMetricsPayload | null> {
  const res = await fetch("/api/admin/dashboard/kyc-metrics", {
    credentials: "same-origin",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data?.data?.metrics as KycMetricsPayload) ?? null;
}
