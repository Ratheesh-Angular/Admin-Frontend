"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import type { CountryRow } from "@/lib/registration-countries";
import { AdminCountryFlag } from "@/components/country/AdminCountryFlag";
import { fieldControlBase, fieldControlError } from "@/lib/field-styles";

export type AdminMultiCountrySelectProps = {
  value: string[];
  onChange: (couCodes: string[]) => void;
  countries: CountryRow[];
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
};

export function AdminMultiCountrySelect({
  value,
  onChange,
  countries,
  loading = false,
  error,
  disabled = false,
  placeholder = "Select countries…",
}: AdminMultiCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(value.map((c) => c.toUpperCase())), [value]);

  const selectedRows = useMemo(
    () => countries.filter((c) => selectedSet.has(c.couCode)),
    [countries, selectedSet],
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

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const maxHeight = 208;
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
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-admin-multi-country-select]")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function toggleCode(couCode: string) {
    const upper = couCode.toUpperCase();
    if (selectedSet.has(upper)) {
      onChange(value.filter((c) => c.toUpperCase() !== upper));
    } else {
      onChange([...value, upper]);
    }
  }

  function removeCode(couCode: string) {
    const upper = couCode.toUpperCase();
    onChange(value.filter((c) => c.toUpperCase() !== upper));
  }

  const dropdownPanel = open ? (
    <div
      data-admin-multi-country-select
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
          filtered.map((c) => {
            const on = selectedSet.has(c.couCode);
            return (
              <li key={c.couCode}>
                <button
                  type="button"
                  onClick={() => toggleCode(c.couCode)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                    on ? "bg-indigo-50 text-indigo-800 font-medium" : "text-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      on
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
              <AdminCountryFlag couCode={c.couCode} size="sm" />
                  <span className="flex-1 truncate">{c.couName}</span>
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {c.couCode}
                  </span>
                </button>
              </li>
            );
          })}
        {!loading && filtered.length === 0 && (
          <li className="px-3 py-4 text-sm text-slate-400 text-center">
            No countries found
          </li>
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className="space-y-1.5" ref={rootRef} data-admin-multi-country-select>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((v) => !v);
          setSearch("");
        }}
        className={`${fieldControlBase} flex items-center justify-between gap-2 text-left min-h-10 h-auto py-2 ${
          error ? fieldControlError : ""
        }`}
      >
        <span className={selectedRows.length ? "text-slate-900" : "text-slate-400"}>
          {loading
            ? "Loading countries…"
            : selectedRows.length
              ? `${selectedRows.length} countr${selectedRows.length === 1 ? "y" : "ies"} selected`
              : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {selectedRows.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedRows.map((c) => (
            <span
              key={c.couCode}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 pl-1.5 pr-1 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-600/15"
            >
              <AdminCountryFlag couCode={c.couCode} size="sm" />
              {c.couName}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeCode(c.couCode)}
                className="rounded-full p-0.5 hover:bg-indigo-100 text-indigo-600"
                aria-label={`Remove ${c.couName}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {mounted && dropdownPanel ? createPortal(dropdownPanel, document.body) : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
