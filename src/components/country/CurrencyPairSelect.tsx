"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { CurrencyPairStack } from "@/components/rate-settings/CurrencyPairStack";
import { fieldControlBase, fieldControlError } from "@/lib/field-styles";

export type CurrencyPairOption = {
  id: string;
  baseCountryCode: string;
  quoteCountryCode: string;
  baseCurrency: string;
  quoteCurrency: string;
};

export type CurrencyPairSelectProps = {
  label: string;
  value: string;
  onChange: (currencyPairId: string) => void;
  options: CurrencyPairOption[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
};

const ROW_HEIGHT = 40;
const VIEWPORT_HEIGHT = 240;
const OVERSCAN = 4;

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2013\u2014\u2212–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pairSearchText(pair: CurrencyPairOption): string {
  return normalizeSearch(
    `${pair.baseCurrency} - ${pair.quoteCurrency} ${pair.baseCountryCode} ${pair.quoteCountryCode}`,
  );
}

export function CurrencyPairSelect({
  label,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  error,
  placeholder = "Select currency pair…",
}: CurrencyPairSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.id === value);
  const showLoading = loading && options.length === 0;

  const filtered = useMemo(() => {
    const tokens = normalizeSearch(search).split(" ").filter(Boolean);
    if (tokens.length === 0) return options;
    return options.filter((o) => {
      const haystack = pairSearchText(o);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [options, search]);

  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const total = filtered.length * ROW_HEIGHT;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(filtered.length, start + visibleCount);
    return { startIndex: start, endIndex: end, totalHeight: total };
  }, [filtered.length, scrollTop]);

  const visibleOptions = useMemo(
    () => filtered.slice(startIndex, endIndex),
    [filtered, startIndex, endIndex],
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [open, search]);

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
        width: Math.max(rect.width, 320),
        zIndex: 10000,
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
      if (!target.closest("[data-currency-pair-select]")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const dropdown = open ? (
    <div
      data-currency-pair-select
      style={panelStyle}
      className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
    >
      <div className="p-2 border-b border-slate-100 shrink-0">
        <input
          autoFocus
          placeholder="Search currency pair…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>
      <ul
        ref={listRef}
        className="overflow-y-auto py-1 flex-1 min-h-0"
        style={{ maxHeight: VIEWPORT_HEIGHT }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {filtered.length === 0 ? (
          <li className="px-3 py-4 text-sm text-slate-400 text-center">
            No currency pairs found
          </li>
        ) : (
          <li
            style={{ height: totalHeight, position: "relative", listStyle: "none" }}
          >
            {visibleOptions.map((o, idx) => {
              const rowIndex = startIndex + idx;
              return (
                <div
                  key={o.id}
                  style={{
                    position: "absolute",
                    top: rowIndex * ROW_HEIGHT,
                    left: 0,
                    right: 0,
                    height: ROW_HEIGHT,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full h-full flex items-center gap-3 px-3 text-sm text-left hover:bg-slate-50 ${
                      value === o.id
                        ? "bg-indigo-50 text-indigo-800 font-medium"
                        : "text-slate-700"
                    }`}
                  >
                    <CurrencyPairStack
                      baseCountryCode={o.baseCountryCode}
                      quoteCountryCode={o.quoteCountryCode}
                      baseCurrency={o.baseCurrency}
                      quoteCurrency={o.quoteCurrency}
                      compact
                      eagerFlags
                    />
                  </button>
                </div>
              );
            })}
          </li>
        )}
      </ul>
    </div>
  ) : null;

  return (
    <div className="space-y-1.5" data-currency-pair-select>
      <label className="text-sm font-medium text-slate-700 block">
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || showLoading}
        onClick={() => {
          if (disabled || showLoading) return;
          setOpen((v) => !v);
          setSearch("");
        }}
        className={`${fieldControlBase} flex items-center justify-between gap-2 text-left ${
          error ? fieldControlError : ""
        }`}
      >
        {showLoading ? (
          <span className="text-slate-400">Loading…</span>
        ) : selected ? (
          <CurrencyPairStack
            baseCountryCode={selected.baseCountryCode}
            quoteCountryCode={selected.quoteCountryCode}
            baseCurrency={selected.baseCurrency}
            quoteCurrency={selected.quoteCurrency}
            compact
          />
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
