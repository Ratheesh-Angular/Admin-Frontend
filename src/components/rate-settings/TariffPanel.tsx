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
};

function formatAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function TariffPanel({ audience }: TariffPanelProps) {
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
  const [editing, setEditing] = useState<TariffRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTariffs = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/tariffs?audience=${encodeURIComponent(audience)}`,
        { credentials: "same-origin" },
      );
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
  }, [audience]);

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
    void loadPairs();
  }, [loadTariffs, loadPairs]);

  const handleDelete = useCallback(
    async (row: TariffRow) => {
      const pair = row.currencyPair;
      const label = `${pair.baseCurrency} - ${pair.quoteCurrency}`;
      if (!window.confirm(`Delete tariff for ${label}?`)) return;

      setDeletingId(row.id);
      setMessage(null);
      try {
        const res = await fetch(`/api/admin/tariffs/${row.id}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({
            kind: "err",
            text: data?.error || "Could not delete tariff.",
          });
          return;
        }
        setMessage({ kind: "ok", text: "Tariff deleted." });
        await loadTariffs();
      } catch {
        setMessage({ kind: "err", text: "Network error." });
      } finally {
        setDeletingId(null);
      }
    },
    [loadTariffs],
  );

  const columns = useMemo(
    () => [
      {
        id: "pair",
        header: "Currency pair",
        searchText: (row: TariffRow) => {
          const p = row.currencyPair;
          return `${p.baseCurrency} - ${p.quoteCurrency} ${p.baseCountryCode} ${p.quoteCountryCode}`;
        },
        cell: (row: TariffRow) => (
          <CurrencyPairStack
            baseCountryCode={row.currencyPair.baseCountryCode}
            quoteCountryCode={row.currencyPair.quoteCountryCode}
            baseCurrency={row.currencyPair.baseCurrency}
            quoteCurrency={row.currencyPair.quoteCurrency}
          />
        ),
      },
      {
        id: "minimum",
        header: "Minimum",
        searchText: (row: TariffRow) => row.minimum,
        cell: (row: TariffRow) => formatAmount(row.minimum),
      },
      {
        id: "maximum",
        header: "Maximum",
        searchText: (row: TariffRow) => row.maximum,
        cell: (row: TariffRow) => formatAmount(row.maximum),
      },
      {
        id: "type",
        header: "Type",
        searchText: (row: TariffRow) => formatType(row.type),
        cell: (row: TariffRow) => formatType(row.type),
      },
      {
        id: "value",
        header: "Value (fees)",
        searchText: (row: TariffRow) => row.value,
        cell: (row: TariffRow) => formatTariffValue(row.type, row.value),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right w-28",
        cellClassName: "text-right",
        cell: (row: TariffRow) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setModalMode("edit");
                setEditing(row);
                setModalOpen(true);
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
              aria-label="Edit tariff"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(row)}
              disabled={deletingId === row.id}
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label="Delete tariff"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [deletingId, handleDelete],
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

      <AdminDataTable
        columns={columns}
        data={tariffs}
        getRowKey={(row) => row.id}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tariffs…"
        loading={loading}
        emptyMessage="No tariffs yet. Add your first tariff."
        filteredEmptyMessage="No tariffs match your search."
        toolbar={
          <button
            type="button"
            onClick={() => {
              setModalMode("create");
              setEditing(null);
              setModalOpen(true);
            }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-10 text-sm font-medium transition-colors"
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
        initial={editing}
        pairOptions={pairOptions}
        pairsLoading={pairsLoading}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setMessage({
            kind: "ok",
            text: modalMode === "edit" ? "Tariff updated." : "Tariff added.",
          });
          await loadTariffs();
        }}
      />
    </div>
  );
}
