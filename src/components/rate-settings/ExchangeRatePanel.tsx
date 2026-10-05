"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  RefreshCw,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { AdminDataTable } from "@/components/ui/AdminDataTable";
import { CurrencyPairStack } from "./CurrencyPairStack";
import type { CurrencyPairOption } from "@/components/country/CurrencyPairSelect";

type ExchangeRatePanelProps = {
  countryCode: string;
  countryName: string;
  countryReady: boolean;
};

type ExchangeRateSetting = {
  margin: string;
  active: boolean;
  activatedAt: string | null;
  offeredRateAtActivation: string | null;
  updatedAt: string;
};

type ExchangeRateRow = {
  currencyPairId: string;
  currencyPair: CurrencyPairOption;
  offeredRate: number | null;
  rateError: string | null;
  fetchedAt: string;
  customerRate: number | null;
  setting: ExchangeRateSetting | null;
};

type RowStatus = "active" | "pending" | "flex";

type RowView = {
  row: ExchangeRateRow;
  draft: string;
  marginValid: boolean;
  marginError: string | null;
  previewRate: number | null;
  status: RowStatus;
  dirty: boolean;
  canSet: boolean;
};

const rateFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 8,
});

function formatRate(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return rateFormatter.format(value);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatShortDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pairLabel(pair: CurrencyPairOption): string {
  return `${pair.baseCurrency} - ${pair.quoteCurrency}`;
}

function readError(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const d = data as { error?: unknown; message?: unknown };
    if (typeof d.error === "string" && d.error.trim()) return d.error;
    if (typeof d.message === "string" && d.message.trim()) return d.message;
  }
  return fallback;
}

function buildRowView(row: ExchangeRateRow, draft: string): RowView {
  const trimmed = draft.trim();
  const isActive = Boolean(row.setting?.active);
  const marginNum = trimmed === "" ? null : Number(trimmed);

  let marginError: string | null = null;
  if (marginNum != null) {
    if (!Number.isFinite(marginNum)) marginError = "Enter a valid number.";
    else if (marginNum < 0) marginError = "Margin cannot be negative.";
  }
  const marginValid = marginNum != null && marginError == null;

  let previewRate: number | null = null;
  if (marginValid && row.offeredRate != null) {
    previewRate = row.offeredRate - marginNum!;
    if (previewRate <= 0) {
      marginError = "Margin must be lower than the offered rate.";
      previewRate = null;
    }
  }

  const savedMargin = row.setting ? Number(row.setting.margin) : null;
  const dirty = isActive
    ? marginValid && marginNum !== savedMargin
    : marginValid;

  let status: RowStatus = "flex";
  if (dirty && previewRate != null) status = "pending";
  else if (isActive) status = "active";

  const canSet =
    row.offeredRate != null && previewRate != null && dirty && !marginError;

  return {
    row,
    draft,
    marginValid,
    marginError,
    previewRate,
    status,
    dirty,
    canSet,
  };
}

function rowClassName(view: RowView): string {
  switch (view.status) {
    case "active":
      return "bg-emerald-50/40 shadow-[inset_4px_0_0_0_#10b981]";
    case "pending":
      return "bg-amber-50/40 shadow-[inset_4px_0_0_0_#f59e0b]";
    default:
      return "";
  }
}

function StatusPill({ view }: { view: RowView }) {
  if (view.status === "active" && !view.dirty) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Active
        {view.row.setting?.activatedAt ? (
          <span className="font-normal text-emerald-700">
            · since {formatShortDateTime(view.row.setting.activatedAt)}
          </span>
        ) : null}
      </span>
    );
  }
  if (view.status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
        <Clock className="w-3.5 h-3.5" />
        Not active · click Set rate
      </span>
    );
  }
  if (view.status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-500/15">
      <CircleDashed className="w-3.5 h-3.5" />
      Using Flex rate
    </span>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "slate" | "emerald" | "indigo";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "indigo"
        ? "text-indigo-700"
        : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

export function ExchangeRatePanel({
  countryCode,
  countryName,
  countryReady,
}: ExchangeRatePanelProps) {
  const [rows, setRows] = useState<ExchangeRateRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const loadRates = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!countryReady || !countryCode) {
        setRows([]);
        setDrafts({});
        setFetchedAt(null);
        setLoading(false);
        return;
      }

      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setMessage(null);
      try {
        const qs = new URLSearchParams({ countryCode });
        const res = await fetch(`/api/admin/exchange-rates?${qs.toString()}`, {
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({
            kind: "err",
            text: readError(data, "Failed to load exchange rates."),
          });
          if (mode === "initial") setRows([]);
          return;
        }
        const nextRows = (data?.data?.rows as ExchangeRateRow[]) ?? [];
        setRows(nextRows);
        setFetchedAt((data?.data?.fetchedAt as string) ?? null);
        setDrafts((prev) => {
          const next: Record<string, string> = {};
          for (const r of nextRows) {
            if (mode === "refresh" && prev[r.currencyPairId] != null) {
              next[r.currencyPairId] = prev[r.currencyPairId];
            } else {
              next[r.currencyPairId] = r.setting?.active ? r.setting.margin : "";
            }
          }
          return next;
        });
      } catch {
        setMessage({ kind: "err", text: "Network error." });
        if (mode === "initial") setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [countryCode, countryReady],
  );

  useEffect(() => {
    void loadRates("initial");
  }, [loadRates]);

  const views = useMemo(
    () => rows.map((r) => buildRowView(r, drafts[r.currencyPairId] ?? "")),
    [rows, drafts],
  );

  const activeCount = rows.filter((r) => r.setting?.active).length;

  const setDraft = useCallback((id: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSetRate = useCallback(
    async (view: RowView) => {
      if (!view.canSet) return;
      const id = view.row.currencyPairId;
      setSavingId(id);
      setMessage(null);
      try {
        const res = await fetch("/api/admin/exchange-rates", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            countryCode,
            currencyPairId: id,
            margin: view.draft.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({
            kind: "err",
            text: readError(data, "Could not activate the customer rate."),
          });
          return;
        }
        const updated = data?.data?.row as
          | (Omit<ExchangeRateRow, "rateError"> & { rateError?: null })
          | undefined;
        if (updated) {
          setRows((prev) =>
            prev.map((r) =>
              r.currencyPairId === id
                ? {
                    ...r,
                    offeredRate: updated.offeredRate,
                    customerRate: updated.customerRate,
                    fetchedAt: updated.fetchedAt,
                    rateError: null,
                    setting: updated.setting,
                  }
                : r,
            ),
          );
          if (updated.setting) setDraft(id, updated.setting.margin);
        }
        setMessage({
          kind: "ok",
          text: `Customer rate for ${pairLabel(view.row.currencyPair)} is now active at ${formatRate(updated?.customerRate ?? view.previewRate)}.`,
        });
      } catch {
        setMessage({ kind: "err", text: "Network error." });
      } finally {
        setSavingId(null);
      }
    },
    [countryCode, setDraft],
  );

  const handleDeactivate = useCallback(
    async (row: ExchangeRateRow) => {
      const label = pairLabel(row.currencyPair);
      if (
        !window.confirm(
          `Deactivate the customer rate for ${label}? Customers will get the Flex offered rate again.`,
        )
      ) {
        return;
      }
      const id = row.currencyPairId;
      setDeactivatingId(id);
      setMessage(null);
      try {
        const qs = new URLSearchParams({ countryCode, currencyPairId: id });
        const res = await fetch(`/api/admin/exchange-rates?${qs.toString()}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({
            kind: "err",
            text: readError(data, "Could not deactivate the customer rate."),
          });
          return;
        }
        const setting = (data?.data?.row?.setting as ExchangeRateSetting) ?? null;
        setRows((prev) =>
          prev.map((r) =>
            r.currencyPairId === id
              ? { ...r, setting, customerRate: r.offeredRate }
              : r,
          ),
        );
        setDraft(id, "");
        setMessage({
          kind: "ok",
          text: `${label} now uses the Flex offered rate.`,
        });
      } catch {
        setMessage({ kind: "err", text: "Network error." });
      } finally {
        setDeactivatingId(null);
      }
    },
    [countryCode, setDraft],
  );

  const columns = useMemo(
    () => [
      {
        id: "pair",
        header: "Currency Pair",
        searchText: (v: RowView) => {
          const p = v.row.currencyPair;
          return `${p.baseCurrency} - ${p.quoteCurrency} ${p.baseCountryCode} ${p.quoteCountryCode}`;
        },
        cell: (v: RowView) => (
          <CurrencyPairStack
            baseCountryCode={v.row.currencyPair.baseCountryCode}
            quoteCountryCode={v.row.currencyPair.quoteCountryCode}
            baseCurrency={v.row.currencyPair.baseCurrency}
            quoteCurrency={v.row.currencyPair.quoteCurrency}
          />
        ),
      },
      {
        id: "date",
        header: "Date",
        headerClassName: "whitespace-nowrap",
        cell: (v: RowView) => (
          <div className="whitespace-nowrap">
            <p className="text-sm text-slate-800">{formatDate(v.row.fetchedAt)}</p>
            <p className="text-xs text-slate-500 tabular-nums">
              {formatTime(v.row.fetchedAt)}
            </p>
          </div>
        ),
      },
      {
        id: "offered",
        header: "Offered rate",
        headerClassName: "whitespace-nowrap",
        searchText: (v: RowView) => formatRate(v.row.offeredRate),
        cell: (v: RowView) =>
          v.row.offeredRate != null ? (
            <div className="whitespace-nowrap">
              <p className="text-sm font-medium text-slate-900 tabular-nums">
                {formatRate(v.row.offeredRate)}
              </p>
              <p className="text-xs text-slate-500">
                1 {v.row.currencyPair.baseCurrency} in{" "}
                {v.row.currencyPair.quoteCurrency} · Flex
              </p>
            </div>
          ) : (
            <div className="max-w-[12rem]">
              <p className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                <AlertTriangle className="w-4 h-4" />
                Unavailable
              </p>
              <button
                type="button"
                onClick={() => void loadRates("refresh")}
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          ),
      },
      {
        id: "margin",
        header: "Margin Value",
        headerClassName: "whitespace-nowrap",
        cell: (v: RowView) => {
          const id = v.row.currencyPairId;
          const lastMargin =
            v.row.setting && !v.row.setting.active ? v.row.setting.margin : null;
          const marginNum = Number(v.draft);
          const pct =
            v.marginValid && v.row.offeredRate
              ? (marginNum / v.row.offeredRate) * 100
              : null;
          return (
            <div className="w-40">
              <div
                className={`flex items-center rounded-lg border bg-white h-9 overflow-hidden focus-within:ring-2 ${
                  v.marginError
                    ? "border-red-300 focus-within:ring-red-500/20"
                    : "border-slate-200 focus-within:border-indigo-600 focus-within:ring-indigo-500/20"
                }`}
              >
                <span className="pl-2.5 pr-1 text-slate-400 text-sm select-none">
                  −
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={v.draft}
                  onChange={(e) => setDraft(id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && v.canSet) void handleSetRate(v);
                  }}
                  placeholder="0.00"
                  disabled={v.row.offeredRate == null || savingId === id}
                  aria-label={`Margin for ${pairLabel(v.row.currencyPair)}`}
                  className="w-full min-w-0 pr-2.5 text-sm tabular-nums outline-none bg-transparent disabled:text-slate-400"
                />
              </div>
              {v.marginError ? (
                <p className="mt-1 text-xs text-red-600">{v.marginError}</p>
              ) : pct != null && marginNum > 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  ≈ {pct.toLocaleString(undefined, { maximumFractionDigits: 2 })}% of
                  offered
                </p>
              ) : lastMargin && !v.draft ? (
                <button
                  type="button"
                  onClick={() => setDraft(id, lastMargin)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Use last margin ({lastMargin})
                </button>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "customer",
        header: "Customer Rate",
        headerClassName: "whitespace-nowrap",
        searchText: (v: RowView) =>
          v.status === "active"
            ? "active"
            : v.status === "pending"
              ? "not active pending"
              : "using flex rate",
        cell: (v: RowView) => {
          const isActive = Boolean(v.row.setting?.active);
          let main: ReactNode;
          if (v.status === "pending") {
            main = (
              <p className="text-sm font-semibold text-amber-900 tabular-nums">
                {formatRate(v.previewRate)}
              </p>
            );
          } else if (isActive) {
            main = (
              <p className="text-base font-bold text-emerald-700 tabular-nums">
                {formatRate(v.row.customerRate)}
              </p>
            );
          } else {
            main = (
              <p className="text-sm text-slate-500 tabular-nums">
                {formatRate(v.row.offeredRate)}
                {v.row.offeredRate != null ? (
                  <span className="ml-1.5 text-xs text-slate-400">= offered rate</span>
                ) : null}
              </p>
            );
          }
          return (
            <div className="space-y-1 min-w-[11rem]">
              {main}
              {isActive && v.dirty ? (
                <p className="text-xs text-slate-500">
                  Live now:{" "}
                  <span className="font-medium text-emerald-700 tabular-nums">
                    {formatRate(v.row.customerRate)}
                  </span>
                </p>
              ) : null}
              <StatusPill view={v} />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (v: RowView) => {
          const id = v.row.currencyPairId;
          const isActive = Boolean(v.row.setting?.active);
          const saving = savingId === id;
          return (
            <div className="flex flex-col items-end gap-1.5">
              <button
                type="button"
                disabled={!v.canSet || saving}
                onClick={() => void handleSetRate(v)}
                className={`cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 h-9 text-sm font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed ${
                  v.canSet
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    : isActive && !v.dirty
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : isActive && !v.dirty ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Rate set
                  </>
                ) : (
                  "Set rate"
                )}
              </button>
              {isActive ? (
                <button
                  type="button"
                  onClick={() => void handleDeactivate(v.row)}
                  disabled={deactivatingId === id}
                  className="cursor-pointer inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  {deactivatingId === id ? "Deactivating…" : "Deactivate"}
                </button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [deactivatingId, handleDeactivate, handleSetRate, loadRates, savingId, setDraft],
  );

  return (
    <div className="space-y-4">
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

      {countryReady && !loading && rows.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Currency pairs"
            value={rows.length.toLocaleString()}
            tone="slate"
          />
          <SummaryCard
            label="Active custom rates"
            value={activeCount.toLocaleString()}
            tone="emerald"
          />
          <SummaryCard
            label="Using Flex rate"
            value={(rows.length - activeCount).toLocaleString()}
            tone="slate"
          />
          <SummaryCard
            label="Rates fetched"
            value={fetchedAt ? formatTime(fetchedAt) : "—"}
            tone="indigo"
          />
        </div>
      ) : null}

      <AdminDataTable
        columns={columns}
        data={views}
        getRowKey={(v) => v.row.currencyPairId}
        getRowClassName={rowClassName}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search currency pairs…"
        loading={loading || !countryReady}
        emptyMessage={
          countryReady
            ? `No tariffs configured for ${countryName || "this country"} yet. Add tariffs to manage exchange rates.`
            : "Select a country to manage exchange rates."
        }
        filteredEmptyMessage="No currency pairs match your search."
        toolbar={
          <button
            type="button"
            disabled={!countryReady || loading || refreshing}
            onClick={() => void loadRates("refresh")}
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh rates"}
          </button>
        }
      />

      <p className="text-xs text-slate-500">
        Customer rate = offered rate − margin. When a rate is active, customers
        sending from {countryName || "this country"} get the live Flex rate minus
        your margin. Without an active rate, they get the Flex offered rate.
      </p>
    </div>
  );
}
