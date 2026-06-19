"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FlexRow = { couCode: string; couName: string };

function parseFlexRows(res: { data?: unknown }): FlexRow[] {
  const flexBody = res?.data;
  const inner = flexBody as { data?: { data?: unknown } } | undefined;
  const arr = Array.isArray(inner?.data?.data)
    ? inner!.data!.data
    : Array.isArray((flexBody as { data?: unknown[] })?.data)
      ? (flexBody as { data: unknown[] }).data
      : [];
  return (arr as unknown[])
    .map((r) => ({
      couCode: String((r as FlexRow).couCode ?? "").trim().toUpperCase(),
      couName: String((r as FlexRow).couName ?? "").trim(),
    }))
    .filter((r) => r.couCode && r.couName);
}

export function ManageCountryClient() {
  const [rows, setRows] = useState<FlexRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [allRes, listRes] = await Promise.all([
        fetch("/api/admin/flex-countries"),
        fetch("/api/admin/country-allowlist"),
      ]);
      const allJson = await allRes.json();
      const listJson = await listRes.json();
      if (!allRes.ok) {
        setMessage({ kind: "err", text: allJson.error || "Failed to load countries" });
        setRows([]);
        return;
      }
      setRows(parseFlexRows(allJson));
      const codes = (listJson?.data?.couCodes as string[] | undefined) ?? [];
      setSelected(new Set(codes.map((c) => c.toUpperCase())));
    } catch {
      setMessage({ kind: "err", text: "Network error" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.couName.toLowerCase().includes(q) ||
        r.couCode.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const allowlistActive = selected.size > 0;

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const couCodes = Array.from(selected);
      const r = await fetch("/api/admin/country-allowlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couCodes }),
      });
      const j = await r.json();
      if (!r.ok) {
        setMessage({
          kind: "err",
          text: j.error || j.message || "Save failed",
        });
        return;
      }
      setMessage({
        kind: "ok",
        text:
          couCodes.length === 0
            ? "Cleared — customers will see all Flex countries again."
            : `Saved ${couCodes.length} countr${couCodes.length === 1 ? "y" : "ies"}.`,
      });
    } catch {
      setMessage({ kind: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500">Loading countries…</p>
    );
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
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
        />
        <button
          type="button"
          onClick={() => setSelected(new Set(rows.map((r) => r.couCode)))}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => setSelected(new Set())}
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-medium text-slate-600 hover:text-slate-800"
        >
          Reload
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-9 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        {allowlistActive
          ? "Only checked countries are shown in the customer app. Uncheck all and save to show the full catalog again."
          : "No selection saved — customer app shows the full country catalog."}
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
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(r.couCode)) next.delete(r.couCode);
                    else next.add(r.couCode);
                    return next;
                  });
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
