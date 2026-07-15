"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminDataTable } from "@/components/ui/AdminDataTable";
import { RateSettingsPageShell } from "./RateSettingsPageShell";
import { CurrencyPairStack } from "./CurrencyPairStack";
import {
  CurrencyPairModal,
  type CurrencyPairRow,
} from "./CurrencyPairModal";
import type { PlatformCurrencyOption } from "@/lib/country-currency";

export function CurrencyPairClient() {
  const [pairs, setPairs] = useState<CurrencyPairRow[]>([]);
  const [options, setOptions] = useState<PlatformCurrencyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CurrencyPairRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/currency-pairs", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || "Failed to load currency pairs.",
        });
        setPairs([]);
        return;
      }
      setPairs((data?.data?.pairs as CurrencyPairRow[]) ?? []);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setPairs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const res = await fetch("/api/admin/platform-currencies", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        setOptions((data?.data?.currencies as PlatformCurrencyOption[]) ?? []);
      } else {
        setOptions([]);
      }
    } catch {
      setOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadOptions();
  }, [load, loadOptions]);

  const handleDelete = useCallback(async (row: CurrencyPairRow) => {
    const label = `${row.baseCurrency} – ${row.quoteCurrency}`;
    if (!window.confirm(`Delete currency pair ${label}?`)) return;

    setDeletingId(row.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/currency-pairs/${row.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || "Could not delete currency pair.",
        });
        return;
      }
      setMessage({ kind: "ok", text: "Currency pair deleted." });
      await load();
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setDeletingId(null);
    }
  }, [load]);

  const columns = useMemo(
    () => [
      {
        id: "pair",
        header: "Currency pair",
        searchText: (row: CurrencyPairRow) =>
          `${row.baseCurrency} – ${row.quoteCurrency} ${row.baseCountryCode} ${row.quoteCountryCode}`,
        cell: (row: CurrencyPairRow) => (
          <CurrencyPairStack
            baseCountryCode={row.baseCountryCode}
            quoteCountryCode={row.quoteCountryCode}
            baseCurrency={row.baseCurrency}
            quoteCurrency={row.quoteCurrency}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right w-28",
        cellClassName: "text-right",
        cell: (row: CurrencyPairRow) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setModalMode("edit");
                setEditing(row);
                setModalOpen(true);
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
              aria-label={`Edit ${row.baseCurrency} – ${row.quoteCurrency}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(row)}
              disabled={deletingId === row.id}
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              aria-label={`Delete ${row.baseCurrency} – ${row.quoteCurrency}`}
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
    <RateSettingsPageShell
      title="Currency Pair"
      description="Configure remittance currency pairs from your platform countries."
    >
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
          data={pairs}
          getRowKey={(row) => row.id}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search currency pairs…"
          loading={loading}
          emptyMessage="No currency pairs yet. Add your first pair."
          filteredEmptyMessage="No currency pairs match your search."
          toolbar={
            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setEditing(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-10 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add currency pair
            </button>
          }
        />
      </div>

      <CurrencyPairModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        options={options}
        optionsLoading={optionsLoading}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setMessage({
            kind: "ok",
            text:
              modalMode === "edit"
                ? "Currency pair updated."
                : "Currency pair added.",
          });
          await load();
        }}
      />
    </RateSettingsPageShell>
  );
}
