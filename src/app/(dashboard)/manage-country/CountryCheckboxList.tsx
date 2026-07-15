"use client";

import { useMemo, useState } from "react";

export type CountryRow = { couCode: string; couName: string };

type CountryCheckboxListProps = {
  rows: CountryRow[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  loading?: boolean;
  saving?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onReload: () => void;
  onSave: () => void;
  message: { kind: "ok" | "err"; text: string } | null;
  helperText: string;
  emptySelectionHint: string;
};

export function CountryCheckboxList({
  rows,
  selected,
  onSelectedChange,
  loading = false,
  saving = false,
  search,
  onSearchChange,
  onReload,
  onSave,
  message,
  helperText,
  emptySelectionHint,
}: CountryCheckboxListProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.couName.toLowerCase().includes(q) ||
        r.couCode.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const selectionActive = selected.size > 0;

  if (loading) {
    return <p className="text-sm text-slate-500">Loading countries…</p>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-lg border px-3 py-2.5 text-sm ${
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Filter by name or code…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
        />
        <button
          type="button"
          onClick={() => onSelectedChange(new Set(rows.map((r) => r.couCode)))}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onSelectedChange(new Set())}
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onReload}
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          Reload
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-9 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        {selectionActive ? helperText : emptySelectionHint}
      </p>

      <ul className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 max-h-[min(60vh,520px)] overflow-y-auto">
        {filtered.map((r) => {
          const on = selected.has(r.couCode);
          return (
            <li
              key={`${r.couCode}-${r.couName}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80"
            >
              <input
                type="checkbox"
                id={`c-${r.couCode}`}
                checked={on}
                onChange={() => {
                  const next = new Set(selected);
                  if (next.has(r.couCode)) next.delete(r.couCode);
                  else next.add(r.couCode);
                  onSelectedChange(next);
                }}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor={`c-${r.couCode}`}
                className="flex-1 text-sm cursor-pointer"
              >
                <span className="font-medium text-slate-900">{r.couName}</span>
                <span className="ml-2 text-slate-400 font-mono text-xs">
                  {r.couCode}
                </span>
              </label>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-4 py-8 text-sm text-slate-400 text-center">
            No countries match your filter.
          </li>
        )}
      </ul>
    </div>
  );
}
