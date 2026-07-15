"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { CorporateCustomerOption } from "@/lib/payments/outbound-transfer-types";

type CorporateCustomerSelectProps = {
  value: string;
  onChange: (userId: string) => void;
  customers: CorporateCustomerOption[];
  loading?: boolean;
};

export function CorporateCustomerSelect({
  value,
  onChange,
  customers,
  loading = false,
}: CorporateCustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = customers.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) return customers;
    return customers.filter((c) => {
      const haystack = [c.name, c.email, c.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [customers, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative w-full sm:w-72">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-10 text-sm text-left hover:border-slate-300 disabled:opacity-50"
      >
        <span className="flex-1 truncate text-slate-700">
          {loading
            ? "Loading corporates…"
            : selected
              ? selected.name || selected.email || selected.id
              : "All corporates"}
        </span>
        <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-full min-w-[18rem] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search corporates…"
                className="w-full rounded-md border border-slate-200 pl-8 pr-8 h-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                autoFocus
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1 text-sm">
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full px-3 py-2 text-left hover:bg-slate-50 ${
                  !value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"
                }`}
              >
                All corporates
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-slate-500">No corporates match.</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 ${
                      value === c.id
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-slate-700"
                    }`}
                  >
                    <span className="block font-medium truncate">
                      {c.name || c.email || "Unnamed corporate"}
                    </span>
                    {c.email ? (
                      <span className="block text-xs text-slate-500 truncate">
                        {c.email}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
