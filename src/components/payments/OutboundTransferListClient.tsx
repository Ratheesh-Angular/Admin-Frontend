"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as RowChevron,
  Eye,
  RefreshCw,
} from "lucide-react";
import { CorporateCustomerSelect } from "./CorporateCustomerSelect";
import { PipelineStatusBadge, TransferStatusBadge } from "./transfer-ui";
import {
  beneficiaryName,
  fmtDateTime,
  fmtMoney,
  labelEnum,
} from "@/lib/payments/transfer-format";
import type {
  CorporateCustomerOption,
  OutboundTransferListRow,
} from "@/lib/payments/outbound-transfer-types";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING_PAYMENT", label: "Pending payment" },
  { id: "PAYMENT_SUBMITTED", label: "Payment submitted" },
  { id: "UNDER_REVIEW", label: "Under review" },
  { id: "PROCESSING", label: "Processing" },
  { id: "COMPLETED", label: "Completed" },
  { id: "FAILED", label: "Failed" },
  { id: "CANCELLED", label: "Cancelled" },
];

type OutboundTransferListClientProps = {
  role: "INDIVIDUAL" | "CORPORATE";
  title: string;
  description: string;
  detailBasePath: string;
};

export function OutboundTransferListClient({
  role,
  title,
  description,
  detailBasePath,
}: OutboundTransferListClientProps) {
  const router = useRouter();
  const [transfers, setTransfers] = useState<OutboundTransferListRow[]>([]);
  const [corporates, setCorporates] = useState<CorporateCustomerOption[]>([]);
  const [corporateUserId, setCorporateUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCorporates, setLoadingCorporates] = useState(
    role === "CORPORATE",
  );
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const skipScrollOnMount = useRef(true);

  const loadCorporates = useCallback(async () => {
    if (role !== "CORPORATE") return;
    setLoadingCorporates(true);
    try {
      const res = await fetch("/api/admin/users?role=CORPORATE", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        const users = (data?.data?.users as CorporateCustomerOption[]) ?? [];
        setCorporates(users);
      }
    } catch {
      /* optional filter list */
    } finally {
      setLoadingCorporates(false);
    }
  }, [role]);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({ role });
      if (role === "CORPORATE" && corporateUserId) {
        qs.set("userId", corporateUserId);
      }
      const res = await fetch(`/api/admin/transfers?${qs.toString()}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || data?.message || "Failed to load transfers.",
        });
        setTransfers([]);
        return;
      }
      setTransfers((data?.data?.transfers as OutboundTransferListRow[]) ?? []);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [role, corporateUserId]);

  useEffect(() => {
    void loadCorporates();
  }, [loadCorporates]);

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, corporateUserId, fromDate, toDate]);

  const filtered = useMemo(() => {
    const tokens = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const fromMs = fromDate
      ? new Date(`${fromDate}T00:00:00.000Z`).getTime()
      : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : null;

    return transfers.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;

      if (fromMs != null || toMs != null) {
        const createdMs = new Date(t.createdAt).getTime();
        if (fromMs != null && createdMs < fromMs) return false;
        if (toMs != null && createdMs > toMs) return false;
      }

      if (tokens.length === 0) return true;
      const haystack = [
        t.referenceCode,
        t.user.name,
        t.user.email,
        t.user.phone,
        t.status,
        t.payInMethod,
        t.beneficiary?.deliveryChannel,
        beneficiaryName(t.beneficiary),
        t.recipientCountryLabel,
        t.senderCountryIso2,
        t.flexPayoutStatus,
        t.flexStkStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [transfers, search, statusFilter, fromDate, toDate]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of transfers) {
      counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
    }
    return counts;
  }, [transfers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (skipScrollOnMount.current) {
      skipScrollOnMount.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  function openTransfer(id: string) {
    router.push(`${detailBasePath}/${id}`);
  }

  function TransferMeta({
    label,
    children,
  }: {
    label: string;
    children: ReactNode;
  }) {
    return (
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
          {label}
        </p>
        <div className="text-sm text-slate-800 truncate">{children}</div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            Remittance
          </p>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
          <p className="text-xs text-slate-400 mt-2">
            Click any row to open full transfer details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadTransfers()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 h-10 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {!loading && transfers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.id === "ALL" ? transfers.length : (statusCounts.get(f.id) ?? 0);
            if (f.id !== "ALL" && count === 0) return null;
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
                <span
                  className={`tabular-nums ${active ? "text-indigo-100" : "text-slate-400"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 bg-slate-50/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, customer, status, corridor…"
              className="w-full sm:max-w-md rounded-lg border border-slate-200 px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
            {role === "CORPORATE" ? (
              <CorporateCustomerSelect
                value={corporateUserId}
                onChange={setCorporateUserId}
                customers={corporates}
                loading={loadingCorporates}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="transfer-from-date"
                className="block text-xs font-medium text-slate-500 mb-1"
              >
                From date
              </label>
              <input
                id="transfer-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            <div>
              <label
                htmlFor="transfer-to-date"
                className="block text-xs font-medium text-slate-500 mb-1"
              >
                To date
              </label>
              <input
                id="transfer-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
            {fromDate || toDate ? (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="h-10 px-3 text-sm font-medium text-slate-600 hover:text-indigo-700"
              >
                Clear dates
              </button>
            ) : null}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-4 py-16 text-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading transfers…
            </div>
          ) : pageRows.length === 0 ? (
            <div className="px-4 py-16 text-center text-slate-500">
              {search.trim() || statusFilter !== "ALL" || fromDate || toDate
                ? "No transfers match your filters."
                : "No transfers found."}
            </div>
          ) : (
            pageRows.map((t) => (
              <article
                key={t.id}
                tabIndex={0}
                role="link"
                aria-label={`View transfer ${t.referenceCode}`}
                onClick={() => openTransfer(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openTransfer(t.id);
                  }
                }}
                className="group cursor-pointer px-4 py-4 sm:px-6 hover:bg-indigo-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:-outline-offset-2 even:bg-slate-50/30"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-2 text-xs font-medium text-white shadow-sm group-hover:bg-indigo-700 mt-0.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View</span>
                  </span>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {t.referenceCode}
                      </span>
                      <TransferStatusBadge status={t.status} compact />
                      <span className="hidden sm:inline text-xs text-slate-400">
                        ·
                      </span>
                      <span className="text-xs text-slate-500">
                        {fmtDateTime(t.createdAt)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {t.user.name || t.user.email || "—"}
                      </p>
                      {t.user.email ? (
                        <p className="text-xs text-slate-500 truncate">
                          {t.user.email}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      <TransferMeta label="You send">
                        <span className="tabular-nums font-medium">
                          {fmtMoney(t.payAmount, t.payCurrency)}
                        </span>
                      </TransferMeta>
                      <TransferMeta label="Recipient gets">
                        <span className="tabular-nums">
                          {fmtMoney(t.receiveAmount, t.receiveCurrency)}
                        </span>
                      </TransferMeta>
                      <TransferMeta label="Fee">
                        <span className="tabular-nums text-slate-600">
                          {fmtMoney(t.feeAmount, t.payCurrency)}
                        </span>
                      </TransferMeta>
                      <TransferMeta label="Rate">
                        <span className="tabular-nums text-slate-600">
                          {t.fxRateSnapshot ?? "—"}
                        </span>
                      </TransferMeta>
                      <TransferMeta label="Corridor">
                        <span className="text-xs font-medium">
                          {t.senderCountryIso2 ?? "—"} →{" "}
                          {t.recipientCountryLabel ||
                            t.recipientCountryIso2 ||
                            "—"}
                        </span>
                      </TransferMeta>
                      <TransferMeta label="Pay in">
                        {labelEnum(t.payInMethod)}
                      </TransferMeta>
                      <TransferMeta label="Beneficiary">
                        {beneficiaryName(t.beneficiary)}
                      </TransferMeta>
                      <TransferMeta label="Delivery">
                        {labelEnum(t.beneficiary?.deliveryChannel ?? null)}
                      </TransferMeta>
                      {t.payInMethod === "MOBILE_MONEY" ? (
                        <TransferMeta label="STK">
                          <PipelineStatusBadge value={t.flexStkStatus} />
                        </TransferMeta>
                      ) : null}
                      <TransferMeta label="Payin">
                        <PipelineStatusBadge value={t.flexPayoutStatus} />
                      </TransferMeta>
                      <TransferMeta label="Completed">
                        <span className="text-xs text-slate-600">
                          {t.completedAt ? fmtDateTime(t.completedAt) : "—"}
                        </span>
                      </TransferMeta>
                    </div>
                  </div>

                  <RowChevron className="w-5 h-5 shrink-0 text-slate-300 group-hover:text-indigo-500 mt-1" />
                </div>
              </article>
            ))
          )}
        </div>

        {!loading && filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 bg-slate-50/30">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {filtered.length.toLocaleString()}
              </span>{" "}
              transfer{filtered.length === 1 ? "" : "s"}
              {corporateUserId && role === "CORPORATE"
                ? " for selected corporate"
                : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-slate-500 tabular-nums px-1">
                Page {currentPage.toLocaleString()} of{" "}
                {totalPages.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
