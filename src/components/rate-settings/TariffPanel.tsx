"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminDataTable } from "@/components/ui/AdminDataTable";
import { CurrencyPairStack } from "./CurrencyPairStack";
import {
  TariffModal,
  formatTariffValue,
  formatType,
  type TariffRow,
} from "./TariffModal";
import type { CurrencyPairOption } from "@/components/country/CurrencyPairSelect";

type TariffPanelProps = {
  audience: "INDIVIDUAL" | "CORPORATE";
  countryCode: string;
  countryReady: boolean;
};

type TariffSchedule = {
  currencyPairId: string;
  currencyPair: CurrencyPairOption;
  slabs: TariffRow[];
  overallMin: string;
  overallMax: string;
};

function formatAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function groupTariffs(tariffs: TariffRow[]): TariffSchedule[] {
  const byPair = new Map<string, TariffRow[]>();
  for (const row of tariffs) {
    const list = byPair.get(row.currencyPairId) ?? [];
    list.push(row);
    byPair.set(row.currencyPairId, list);
  }

  const schedules: TariffSchedule[] = [];
  for (const [currencyPairId, slabs] of byPair) {
    const sorted = [...slabs].sort(
      (a, b) => Number(a.minimum) - Number(b.minimum),
    );
    let min = Infinity;
    let max = -Infinity;
    for (const s of sorted) {
      const lo = Number(s.minimum);
      const hi = Number(s.maximum);
      if (lo < min) min = lo;
      if (hi > max) max = hi;
    }
    schedules.push({
      currencyPairId,
      currencyPair: sorted[0].currencyPair,
      slabs: sorted,
      overallMin: Number.isFinite(min) ? String(min) : "",
      overallMax: Number.isFinite(max) ? String(max) : "",
    });
  }

  schedules.sort((a, b) => {
    const aLabel = `${a.currencyPair.baseCurrency}-${a.currencyPair.quoteCurrency}`;
    const bLabel = `${b.currencyPair.baseCurrency}-${b.currencyPair.quoteCurrency}`;
    return aLabel.localeCompare(bLabel);
  });

  return schedules;
}

function formatSlabPreview(slabs: TariffRow[]): string {
  return slabs
    .map((s) => {
      const fee = formatTariffValue(s.type, s.value);
      return `${formatAmount(s.minimum)}–${formatAmount(s.maximum)} (${formatType(s.type)} ${fee})`;
    })
    .join("; ");
}

export function TariffPanel({
  audience,
  countryCode,
  countryReady,
}: TariffPanelProps) {
  const [tariffs, setTariffs] = useState<TariffRow[]>([]);
  const [pairOptions, setPairOptions] = useState<CurrencyPairOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSlabs, setEditingSlabs] = useState<TariffRow[]>([]);
  const [deletingPairId, setDeletingPairId] = useState<string | null>(null);

  const schedules = useMemo(() => groupTariffs(tariffs), [tariffs]);

  const loadTariffs = useCallback(async () => {
    if (!countryReady || !countryCode) {
      setTariffs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams({
        audience,
        countryCode,
      });
      const res = await fetch(`/api/admin/tariffs?${qs.toString()}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || "Failed to load tariffs.",
        });
        setTariffs([]);
        return;
      }
      setTariffs((data?.data?.tariffs as TariffRow[]) ?? []);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setTariffs([]);
    } finally {
      setLoading(false);
    }
  }, [audience, countryCode, countryReady]);

  const loadPairs = useCallback(async () => {
    setPairsLoading(true);
    try {
      const res = await fetch("/api/admin/currency-pairs", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        setPairOptions((data?.data?.pairs as CurrencyPairOption[]) ?? []);
      } else {
        setPairOptions([]);
      }
    } catch {
      setPairOptions([]);
    } finally {
      setPairsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTariffs();
  }, [loadTariffs]);

  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  const handleDelete = useCallback(
    async (schedule: TariffSchedule) => {
      const pair = schedule.currencyPair;
      const label = `${pair.baseCurrency} - ${pair.quoteCurrency}`;
      const count = schedule.slabs.length;
      if (
        !window.confirm(
          `Delete the full tariff schedule for ${label} (${count} slab${count === 1 ? "" : "s"})?`,
        )
      ) {
        return;
      }

      setDeletingPairId(schedule.currencyPairId);
      setMessage(null);
      try {
        const qs = new URLSearchParams({
          audience,
          countryCode,
          currencyPairId: schedule.currencyPairId,
        });
        const res = await fetch(`/api/admin/tariffs/schedule?${qs.toString()}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({
            kind: "err",
            text: data?.error || "Could not delete tariff schedule.",
          });
          return;
        }
        setMessage({ kind: "ok", text: "Tariff schedule deleted." });
        await loadTariffs();
      } catch {
        setMessage({ kind: "err", text: "Network error." });
      } finally {
        setDeletingPairId(null);
      }
    },
    [audience, countryCode, loadTariffs],
  );

  const columns = useMemo(
    () => [
      {
        id: "pair",
        header: "Currency pair",
        searchText: (row: TariffSchedule) => {
          const p = row.currencyPair;
          return `${p.baseCurrency} - ${p.quoteCurrency} ${p.baseCountryCode} ${p.quoteCountryCode}`;
        },
        cell: (row: TariffSchedule) => (
          <CurrencyPairStack
            baseCountryCode={row.currencyPair.baseCountryCode}
            quoteCountryCode={row.currencyPair.quoteCountryCode}
            baseCurrency={row.currencyPair.baseCurrency}
            quoteCurrency={row.currencyPair.quoteCurrency}
          />
        ),
      },
      {
        id: "slabs",
        header: "Slabs",
        searchText: (row: TariffSchedule) => formatSlabPreview(row.slabs),
        cell: (row: TariffSchedule) => (
          <div className="space-y-1 max-w-md">
            <p className="text-sm font-medium text-slate-900">
              {row.slabs.length} range{row.slabs.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {formatSlabPreview(row.slabs)}
            </p>
          </div>
        ),
      },
      {
        id: "range",
        header: "Overall range",
        searchText: (row: TariffSchedule) =>
          `${row.overallMin} ${row.overallMax}`,
        cell: (row: TariffSchedule) => (
          <span className="text-sm text-slate-800 whitespace-nowrap">
            {formatAmount(row.overallMin)} – {formatAmount(row.overallMax)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right w-28",
        cellClassName: "text-right",
        cell: (row: TariffSchedule) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setModalMode("edit");
                setEditingSlabs(row.slabs);
                setModalOpen(true);
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
              aria-label="Edit tariff schedule"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(row)}
              disabled={deletingPairId === row.currencyPairId}
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label="Delete tariff schedule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [deletingPairId, handleDelete],
  );

  const canAdd = countryReady && Boolean(countryCode);

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

      <AdminDataTable
        columns={columns}
        data={schedules}
        getRowKey={(row) => row.currencyPairId}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tariffs…"
        loading={loading || !countryReady}
        emptyMessage={
          countryReady
            ? "No tariffs yet. Add your first tariff."
            : "Select a country to manage tariffs."
        }
        filteredEmptyMessage="No tariffs match your search."
        toolbar={
          <button
            type="button"
            disabled={!canAdd}
            onClick={() => {
              setModalMode("create");
              setEditingSlabs([]);
              setModalOpen(true);
            }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add tariff
          </button>
        }
      />

      <TariffModal
        open={modalOpen}
        mode={modalMode}
        audience={audience}
        countryCode={countryCode}
        initialSlabs={editingSlabs}
        pairOptions={pairOptions}
        pairsLoading={pairsLoading}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setMessage({
            kind: "ok",
            text:
              modalMode === "edit"
                ? "Tariff schedule updated."
                : "Tariff schedule added.",
          });
          await loadTariffs();
        }}
      />
    </div>
  );
}
