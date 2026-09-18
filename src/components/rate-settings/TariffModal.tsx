"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  CurrencyPairSelect,
  type CurrencyPairOption,
} from "@/components/country/CurrencyPairSelect";
import {
  adminButtonPrimary,
  fieldControlBase,
  fieldControlError,
} from "@/lib/field-styles";

export type TariffType = "AMOUNT" | "PERCENTAGE";

export type TariffRow = {
  id: string;
  audience: "INDIVIDUAL" | "CORPORATE";
  countryCode: string;
  currencyPairId: string;
  minimum: string;
  maximum: string;
  type: TariffType;
  value: string;
  currencyPair: CurrencyPairOption;
};

type SlabDraft = {
  key: string;
  minimum: string;
  maximum: string;
  type: TariffType;
  value: string;
};

type TariffModalProps = {
  open: boolean;
  mode: "create" | "edit";
  audience: "INDIVIDUAL" | "CORPORATE";
  countryCode: string;
  /** All existing slabs for the pair when editing (empty when creating). */
  initialSlabs?: TariffRow[];
  pairOptions: CurrencyPairOption[];
  pairsLoading: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

const TYPE_OPTIONS: { value: TariffType; label: string }[] = [
  { value: "AMOUNT", label: "Amount" },
  { value: "PERCENTAGE", label: "Percentage" },
];

const SLAB_STEP = 0.01;

function newSlabKey(): string {
  return `slab-${Math.random().toString(36).slice(2, 10)}`;
}

function emptySlab(minimum = ""): SlabDraft {
  return {
    key: newSlabKey(),
    minimum,
    maximum: "",
    type: "AMOUNT",
    value: "",
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function nextMinimumAfter(maximum: string): string {
  const raw = maximum.trim();
  // Number("") === 0, so blank max must not become "0.01".
  if (!raw) return "";
  const max = Number(raw);
  if (!Number.isFinite(max) || max < 0) return "";
  return String(round2(max + SLAB_STEP));
}

export function TariffModal({
  open,
  mode,
  audience,
  countryCode,
  initialSlabs = [],
  pairOptions,
  pairsLoading,
  onClose,
  onSaved,
}: TariffModalProps) {
  const [currencyPairId, setCurrencyPairId] = useState("");
  const [slabs, setSlabs] = useState<SlabDraft[]>([emptySlab()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const pairId = initialSlabs[0]?.currencyPairId ?? "";
    setCurrencyPairId(pairId);
    if (initialSlabs.length > 0) {
      setSlabs(
        initialSlabs.map((row) => ({
          key: row.id || newSlabKey(),
          minimum: row.minimum,
          maximum: row.maximum,
          type: row.type,
          value: row.value,
        })),
      );
    } else {
      setSlabs([emptySlab()]);
    }
    setErrors({});
    setFormError(null);
    // Reset only when the dialog opens (or mode/slabs identity for that open).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-gated reset
  }, [open, mode]);

  const selectedPair = useMemo(() => {
    const fromOptions = pairOptions.find((p) => p.id === currencyPairId);
    if (fromOptions) return fromOptions;
    return initialSlabs[0]?.currencyPair ?? null;
  }, [pairOptions, currencyPairId, initialSlabs]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function updateSlab(key: string, patch: Partial<SlabDraft>) {
    setSlabs((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  }

  function removeSlab(key: string) {
    setSlabs((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.key !== key);
    });
  }

  function addSlab() {
    setSlabs((prev) => {
      const last = prev[prev.length - 1];
      const nextMin = last ? nextMinimumAfter(last.maximum) : "";
      return [...prev, emptySlab(nextMin)];
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!currencyPairId) next.currencyPairId = "Select a currency pair.";
    if (slabs.length === 0) next.slabs = "Add at least one fee range.";

    const parsed: { min: number; max: number; index: number }[] = [];

    slabs.forEach((slab, index) => {
      const min = Number(slab.minimum);
      const max = Number(slab.maximum);
      const val = Number(slab.value);
      if (!Number.isFinite(min)) {
        next[`slab-${index}-minimum`] = "Enter a valid minimum.";
      } else if (min < 0) {
        next[`slab-${index}-minimum`] = "Minimum must be zero or greater.";
      }
      if (!Number.isFinite(max)) {
        next[`slab-${index}-maximum`] = "Enter a valid maximum.";
      } else if (max < 0) {
        next[`slab-${index}-maximum`] = "Maximum must be zero or greater.";
      }
      if (Number.isFinite(min) && Number.isFinite(max) && min >= max) {
        next[`slab-${index}-maximum`] = "Maximum must be greater than minimum.";
      }
      if (!Number.isFinite(val)) {
        next[`slab-${index}-value`] = "Enter a valid value.";
      } else if (val < 0) {
        next[`slab-${index}-value`] = "Value must be zero or greater.";
      } else if (slab.type === "PERCENTAGE" && val > 100) {
        next[`slab-${index}-value`] = "Percentage cannot exceed 100.";
      }
      if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
        parsed.push({ min: round2(min), max: round2(max), index });
      }
    });

    if (parsed.length > 1) {
      const sorted = [...parsed].sort((a, b) => a.min - b.min);
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const following = sorted[i + 1];
        if (current.max >= following.min) {
          next.slabs = "Fee ranges must not overlap.";
          next[`slab-${following.index}-minimum`] =
            "Overlaps previous range.";
          break;
        }
        const expected = round2(current.max + SLAB_STEP);
        if (following.min !== expected) {
          next.slabs = `Ranges must be contiguous (next minimum = ${expected}).`;
          next[`slab-${following.index}-minimum`] =
            `Must be ${expected} (previous max + 0.01).`;
          break;
        }
      }
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
      const body = {
        mode: mode === "create" ? "create" : "replace",
        audience,
        countryCode,
        currencyPairId,
        slabs: slabs.map((s) => ({
          minimum: Number(s.minimum),
          maximum: Number(s.maximum),
          type: s.type,
          value: Number(s.value),
        })),
      };

      const res = await fetch("/api/admin/tariffs/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.error || data?.message || "Could not save tariff.");
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

  const title =
    mode === "edit"
      ? audience === "INDIVIDUAL"
        ? "Edit tariff (Individuals)"
        : "Edit tariff (Corporates)"
      : audience === "INDIVIDUAL"
        ? "Add tariff (Individuals)"
        : "Add tariff (Corporates)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="px-6 py-5 space-y-5"
        >
          {formError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          ) : null}

          {mode === "edit" && selectedPair ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Currency pair</p>
              <p className="text-base font-semibold text-slate-900">
                {selectedPair.baseCurrency} - {selectedPair.quoteCurrency}
              </p>
            </div>
          ) : (
            <CurrencyPairSelect
              label="Currency pair"
              value={currencyPairId}
              onChange={(id) => {
                setCurrencyPairId(id);
                setErrors((p) => ({ ...p, currencyPairId: "" }));
              }}
              options={pairOptions}
              loading={pairsLoading && pairOptions.length === 0}
              disabled={saving || mode === "edit"}
              error={errors.currencyPairId}
            />
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Fee ranges (slabs)
                </p>
                {/* <p className="text-xs text-slate-500 mt-0.5">
                  Ranges must be contiguous (next min = previous max + 0.01).
                </p> */}
              </div>
              <button
                type="button"
                onClick={addSlab}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add slab
              </button>
            </div>

            {errors.slabs ? (
              <p className="text-xs text-red-500">{errors.slabs}</p>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Minimum</th>
                    <th className="px-3 py-2.5 font-medium">Maximum</th>
                    <th className="px-3 py-2.5 font-medium w-36">Type</th>
                    <th className="px-3 py-2.5 font-medium">Value (fees)</th>
                    <th className="px-3 py-2.5 font-medium w-12 text-right">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slabs.map((slab, index) => (
                    <tr
                      key={slab.key}
                      className="border-t border-slate-100 align-top"
                    >
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={slab.minimum}
                          onChange={(e) => {
                            updateSlab(slab.key, { minimum: e.target.value });
                            setErrors((p) => {
                              const next = { ...p };
                              delete next[`slab-${index}-minimum`];
                              delete next.slabs;
                              return next;
                            });
                          }}
                          disabled={saving}
                          className={`${fieldControlBase} ${
                            errors[`slab-${index}-minimum`]
                              ? fieldControlError
                              : ""
                          }`}
                        />
                        {errors[`slab-${index}-minimum`] ? (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`slab-${index}-minimum`]}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={slab.maximum}
                          onChange={(e) => {
                            updateSlab(slab.key, { maximum: e.target.value });
                            setErrors((p) => {
                              const next = { ...p };
                              delete next[`slab-${index}-maximum`];
                              delete next.slabs;
                              return next;
                            });
                          }}
                          disabled={saving}
                          className={`${fieldControlBase} ${
                            errors[`slab-${index}-maximum`]
                              ? fieldControlError
                              : ""
                          }`}
                        />
                        {errors[`slab-${index}-maximum`] ? (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`slab-${index}-maximum`]}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={slab.type}
                          onChange={(e) =>
                            updateSlab(slab.key, {
                              type: e.target.value as TariffType,
                            })
                          }
                          disabled={saving}
                          className={fieldControlBase}
                        >
                          {TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={slab.value}
                          onChange={(e) => {
                            updateSlab(slab.key, { value: e.target.value });
                            setErrors((p) => {
                              const next = { ...p };
                              delete next[`slab-${index}-value`];
                              return next;
                            });
                          }}
                          disabled={saving}
                          className={`${fieldControlBase} ${
                            errors[`slab-${index}-value`]
                              ? fieldControlError
                              : ""
                          }`}
                        />
                        {errors[`slab-${index}-value`] ? (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`slab-${index}-value`]}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeSlab(slab.key)}
                          disabled={saving || slabs.length <= 1}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Remove slab ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
              {saving
                ? "Saving…"
                : mode === "edit"
                  ? "Save changes"
                  : "Add tariff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatType(type: TariffType): string {
  return type === "PERCENTAGE" ? "Percentage" : "Amount";
}

export function formatTariffValue(type: TariffType, value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (type === "PERCENTAGE") return `${n}%`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export { formatType };
