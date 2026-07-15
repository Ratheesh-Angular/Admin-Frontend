"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
  currencyPairId: string;
  minimum: string;
  maximum: string;
  type: TariffType;
  value: string;
  currencyPair: CurrencyPairOption;
};

type TariffModalProps = {
  open: boolean;
  mode: "create" | "edit";
  audience: "INDIVIDUAL" | "CORPORATE";
  initial?: TariffRow | null;
  pairOptions: CurrencyPairOption[];
  pairsLoading: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

const TYPE_OPTIONS: { value: TariffType; label: string }[] = [
  { value: "AMOUNT", label: "Amount" },
  { value: "PERCENTAGE", label: "Percentage" },
];

export function TariffModal({
  open,
  mode,
  audience,
  initial,
  pairOptions,
  pairsLoading,
  onClose,
  onSaved,
}: TariffModalProps) {
  const [currencyPairId, setCurrencyPairId] = useState("");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [type, setType] = useState<TariffType>("AMOUNT");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setCurrencyPairId(initial?.currencyPairId ?? "");
    setMinimum(initial?.minimum ?? "");
    setMaximum(initial?.maximum ?? "");
    setType(initial?.type ?? "AMOUNT");
    setValue(initial?.value ?? "");
    setErrors({});
    setFormError(null);
  }, [open, initial]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!currencyPairId) next.currencyPairId = "Select a currency pair.";
    const min = Number(minimum);
    const max = Number(maximum);
    const val = Number(value);
    if (!Number.isFinite(min)) next.minimum = "Enter a valid minimum.";
    if (!Number.isFinite(max)) next.maximum = "Enter a valid maximum.";
    if (Number.isFinite(min) && Number.isFinite(max) && min >= max) {
      next.maximum = "Maximum must be greater than minimum.";
    }
    if (!Number.isFinite(val)) next.value = "Enter a valid value.";
    if (type === "PERCENTAGE" && Number.isFinite(val) && val > 100) {
      next.value = "Percentage cannot exceed 100.";
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
          ? `/api/admin/tariffs/${initial.id}`
          : "/api/admin/tariffs";
      const method = mode === "edit" ? "PUT" : "POST";
      const body =
        mode === "edit"
          ? {
              currencyPairId,
              minimum: Number(minimum),
              maximum: Number(maximum),
              type,
              value: Number(value),
            }
          : {
              audience,
              currencyPairId,
              minimum: Number(minimum),
              maximum: Number(maximum),
              type,
              value: Number(value),
            };

      const res = await fetch(url, {
        method,
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
      ? "Edit tariff"
      : audience === "INDIVIDUAL"
        ? "Add tariff (Individuals)"
        : "Add tariff (Corporates)";

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
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
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
          className="px-6 py-5 space-y-4"
        >
          {formError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {formError}
            </p>
          ) : null}

          <CurrencyPairSelect
            label="Currency pair"
            value={currencyPairId}
            onChange={(id) => {
              setCurrencyPairId(id);
              setErrors((p) => ({ ...p, currencyPairId: "" }));
            }}
            options={pairOptions}
            loading={pairsLoading && pairOptions.length === 0}
            disabled={saving}
            error={errors.currencyPairId}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">
                Minimum
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={minimum}
                onChange={(e) => {
                  setMinimum(e.target.value);
                  setErrors((p) => ({ ...p, minimum: "" }));
                }}
                disabled={saving}
                className={`${fieldControlBase} ${errors.minimum ? fieldControlError : ""}`}
              />
              {errors.minimum ? (
                <p className="text-xs text-red-500">{errors.minimum}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">
                Maximum
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={maximum}
                onChange={(e) => {
                  setMaximum(e.target.value);
                  setErrors((p) => ({ ...p, maximum: "" }));
                }}
                disabled={saving}
                className={`${fieldControlBase} ${errors.maximum ? fieldControlError : ""}`}
              />
              {errors.maximum ? (
                <p className="text-xs text-red-500">{errors.maximum}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TariffType)}
              disabled={saving}
              className={fieldControlBase}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block">
              Value (fees)
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setErrors((p) => ({ ...p, value: "" }));
              }}
              disabled={saving}
              className={`${fieldControlBase} ${errors.value ? fieldControlError : ""}`}
            />
            {errors.value ? (
              <p className="text-xs text-red-500">{errors.value}</p>
            ) : null}
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
