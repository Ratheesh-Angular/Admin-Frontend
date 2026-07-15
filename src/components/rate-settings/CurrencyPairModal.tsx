"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PlatformCurrencySelect } from "@/components/country/PlatformCurrencySelect";
import { adminButtonPrimary } from "@/lib/field-styles";
import type { PlatformCurrencyOption } from "@/lib/country-currency";

export type CurrencyPairRow = {
  id: string;
  baseCountryCode: string;
  quoteCountryCode: string;
  baseCurrency: string;
  quoteCurrency: string;
};

type CurrencyPairModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: CurrencyPairRow | null;
  options: PlatformCurrencyOption[];
  optionsLoading: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function CurrencyPairModal({
  open,
  mode,
  initial,
  options,
  optionsLoading,
  onClose,
  onSaved,
}: CurrencyPairModalProps) {
  const [baseCountryCode, setBaseCountryCode] = useState("");
  const [quoteCountryCode, setQuoteCountryCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    base?: string;
    quote?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    setBaseCountryCode(initial?.baseCountryCode ?? "");
    setQuoteCountryCode(initial?.quoteCountryCode ?? "");
    setErrors({});
    setFormError(null);
  }, [open, initial]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!baseCountryCode) next.base = "Select a base currency.";
    if (!quoteCountryCode) next.quote = "Select a quote currency.";
    if (
      baseCountryCode &&
      quoteCountryCode &&
      baseCountryCode === quoteCountryCode
    ) {
      next.quote = "Quote must differ from base.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setFormError(null);
    try {
      const url =
        mode === "edit" && initial
          ? `/api/admin/currency-pairs/${initial.id}`
          : "/api/admin/currency-pairs";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ baseCountryCode, quoteCountryCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.error || data?.message || "Could not save currency pair.");
        return;
      }
      await onSaved();
      onClose();
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit currency pair" : "Add currency pair"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Only platform countries are available.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
          {formError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          ) : null}

          <PlatformCurrencySelect
            label="Base currency"
            value={baseCountryCode}
            onChange={(code) => {
              setBaseCountryCode(code);
              setErrors((p) => ({ ...p, base: undefined }));
            }}
            options={options}
            loading={optionsLoading}
            disabled={saving}
            error={errors.base}
            excludeCouCode={quoteCountryCode}
          />

          <PlatformCurrencySelect
            label="Quote currency"
            value={quoteCountryCode}
            onChange={(code) => {
              setQuoteCountryCode(code);
              setErrors((p) => ({ ...p, quote: undefined }));
            }}
            options={options}
            loading={optionsLoading}
            disabled={saving}
            error={errors.quote}
            excludeCouCode={baseCountryCode}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 h-10 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${adminButtonPrimary} w-auto px-6`}
            >
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Add pair"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
