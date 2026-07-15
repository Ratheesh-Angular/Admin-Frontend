"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { AdminCountryFlag } from "@/components/country/AdminCountryFlag";
import type { PlatformCurrencyOption } from "@/lib/country-currency";
import { fieldControlBase, fieldControlError } from "@/lib/field-styles";

export type PlatformCurrencySelectProps = {
  label: string;
  value: string;
  onChange: (couCode: string) => void;
  options: PlatformCurrencyOption[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  excludeCouCode?: string;
  placeholder?: string;
};

export function PlatformCurrencySelect({
  label,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  error,
  excludeCouCode,
  placeholder = "Select currency…",
}: PlatformCurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  const available = useMemo(() => {
    const ex = excludeCouCode?.toUpperCase();
    return options.filter((o) => o.couCode !== ex);
  }, [options, excludeCouCode]);

  const selected = available.find((o) => o.couCode === value.toUpperCase());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (o) =>
        o.currencyCode.toLowerCase().includes(q) ||
        o.couName.toLowerCase().includes(q) ||
        o.couCode.toLowerCase().includes(q),
    );
  }, [available, search]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 10000,
        maxHeight: 240,
      });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-platform-currency-select]")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const dropdown = open ? (
    <div
      data-platform-currency-select
      style={panelStyle}
      className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
    >
      <div className="p-2 border-b border-slate-100 shrink-0">
        <input
          autoFocus
          placeholder="Search currency or country…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>
      <ul className="overflow-y-auto py-1 flex-1 min-h-0">
        {filtered.map((o) => (
          <li key={o.couCode}>
            <button
              type="button"
              onClick={() => {
                onChange(o.couCode);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                value.toUpperCase() === o.couCode
                  ? "bg-indigo-50 text-indigo-800 font-medium"
                  : "text-slate-700"
              }`}
            >
              <AdminCountryFlag couCode={o.couCode} />
              <span className="font-medium">{o.currencyCode}</span>
              <span className="text-slate-500 truncate">{o.couName}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-4 text-sm text-slate-400 text-center">
            No currencies found
          </li>
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className="space-y-1.5" data-platform-currency-select>
      <label className="text-sm font-medium text-slate-700 block">{label}</label>
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
          error ? fieldControlError : ""
        }`}
      >
        {loading ? (
          <span className="text-slate-400">Loading…</span>
        ) : selected ? (
          <span className="flex items-center gap-2.5 text-slate-900">
            <AdminCountryFlag couCode={selected.couCode} />
            <span className="font-medium">{selected.currencyCode}</span>
            <span className="text-slate-500 truncate">{selected.couName}</span>
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
      </button>
      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
