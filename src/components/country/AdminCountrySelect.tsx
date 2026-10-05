"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { CountryRow } from "@/lib/registration-countries";
import { AdminCountryFlag } from "@/components/country/AdminCountryFlag";
import { fieldControlBase, fieldControlError } from "@/lib/field-styles";

export type AdminCountrySelectProps = {
  label?: string;
  value: string;
  onChange: (couCode: string) => void;
  countries: CountryRow[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
};

export function AdminCountrySelect({
  label = "Country",
  value,
  onChange,
  countries,
  loading = false,
  disabled = false,
  error,
  placeholder = "Select country…",
}: AdminCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = useMemo(
    () => countries.find((c) => c.couCode === value.toUpperCase()),
    [countries, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.couName.toLowerCase().includes(q) ||
        c.couCode.toLowerCase().includes(q),
    );
  }, [countries, search]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      const height = Math.min(maxHeight, openUp ? spaceAbove : spaceBelow);

      setPanelStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 10000,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4, maxHeight: height }
          : { top: rect.bottom + 4, maxHeight: height }),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      setPanelStyle({});
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-admin-country-select]")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const dropdown = open ? (
    <div
      data-admin-country-select
      style={panelStyle}
      className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
    >
      <div className="p-2 border-b border-slate-100 shrink-0">
        <input
          autoFocus
          placeholder="Search country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>
      <ul className="overflow-y-auto py-1 flex-1 min-h-0">
        {loading && (
          <li className="px-3 py-4 text-sm text-slate-400 text-center">
            Loading countries…
          </li>
        )}
        {!loading &&
          filtered.map((c) => (
            <li key={c.couCode}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.couCode);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                  value.toUpperCase() === c.couCode
                    ? "bg-indigo-50 text-indigo-800 font-medium"
                    : "text-slate-700"
                }`}
              >
                <AdminCountryFlag couCode={c.couCode} size="sm" />
                <span className="flex-1 truncate">{c.couName}</span>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {c.couCode}
                </span>
              </button>
            </li>
          ))}
        {!loading && filtered.length === 0 && (
          <li className="px-3 py-4 text-sm text-slate-400 text-center">
            No countries found
          </li>
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className="space-y-1.5" data-admin-country-select>
      {label ? (
        <label className="text-sm font-medium text-slate-700 block">
          {label}
        </label>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((v) => !v);
          setSearch("");
        }}
        className={`${fieldControlBase} flex items-center justify-between gap-2 text-left ${
          open ? "ring-2 ring-indigo-500/20 border-indigo-600" : ""
        } ${error ? fieldControlError : ""}`}
      >
        {loading ? (
          <span className="text-slate-400">Loading…</span>
        ) : selected ? (
          <span className="flex items-center gap-2.5 text-slate-900">
            <AdminCountryFlag couCode={selected.couCode} size="sm" />
            <span className="font-medium">{selected.couName}</span>
            <span className="text-xs font-mono text-slate-400">
              {selected.couCode}
            </span>
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
      </button>
      {mounted && dropdown && panelStyle.position
        ? createPortal(dropdown, document.body)
        : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
