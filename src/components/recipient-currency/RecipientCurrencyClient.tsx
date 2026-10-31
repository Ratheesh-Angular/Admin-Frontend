"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminCountrySelect } from "@/components/country/AdminCountrySelect";
import { useAdminSession } from "@/hooks/useAdminSession";
import type { CountryRow } from "@/lib/registration-countries";
import { legalCurrencyForCouCode } from "@/lib/country-currency";

type RecipientCurrencyConfig = {
  countryCode: string;
  localCurrency: string;
  localEnabled: boolean;
  usdEnabled: boolean;
  eurEnabled: boolean;
  gbpEnabled: boolean;
  persisted: boolean;
};

export function RecipientCurrencyClient() {
  const { session, loading: sessionLoading } = useAdminSession();

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");

  const [localCurrency, setLocalCurrency] = useState("USD");
  const [usdEnabled, setUsdEnabled] = useState(true);
  const [eurEnabled, setEurEnabled] = useState(true);
  const [gbpEnabled, setGbpEnabled] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.couCode === countryCode) ?? null,
    [countries, countryCode],
  );

  const localIsUsd = localCurrency === "USD";
  const localIsEur = localCurrency === "EUR";
  const localIsGbp = localCurrency === "GBP";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (sessionLoading) return;
      if (!session) {
        setCountries([]);
        setCountriesLoading(false);
        return;
      }

      setCountriesLoading(true);
      setCountriesError(null);
      try {
        // Only Manage Country → Payout Countries destinations.
        const res = await fetch(
          "/api/admin/recipient-currency-configs/countries",
          { credentials: "same-origin" },
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            json?.message || json?.error || "Failed to load payout countries",
          );
        }
        const rows = (json?.data?.countries as CountryRow[] | undefined) ?? [];
        if (!cancelled) {
          setCountries(
            rows
              .map((r) => ({
                couCode: String(r.couCode ?? "")
                  .trim()
                  .toUpperCase(),
                couName: String(r.couName ?? "").trim(),
              }))
              .filter((r) => r.couCode && r.couName),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setCountries([]);
          setCountriesError(
            err instanceof Error ? err.message : "Failed to load countries.",
          );
        }
      } finally {
        if (!cancelled) setCountriesLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  useEffect(() => {
    if (!session || countries.length === 0) return;
    setCountryCode((prev) => {
      if (prev && countries.some((c) => c.couCode === prev)) return prev;
      return countries[0].couCode;
    });
  }, [session, countries]);

  const loadConfig = useCallback(async (code: string) => {
    if (!code) return;
    setConfigLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/recipient-currency-configs?countryCode=${encodeURIComponent(code)}`,
        { credentials: "same-origin" },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json?.message || "Failed to load recipient currencies.",
        );
      }
      const data = json.data as RecipientCurrencyConfig;
      setLocalCurrency(data.localCurrency || legalCurrencyForCouCode(code));
      setUsdEnabled(data.usdEnabled);
      setEurEnabled(data.eurEnabled);
      setGbpEnabled(data.gbpEnabled);
    } catch (err) {
      setMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load recipient currencies.",
      });
      const fallback = legalCurrencyForCouCode(code);
      setLocalCurrency(fallback);
      setUsdEnabled(true);
      setEurEnabled(true);
      setGbpEnabled(true);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!countryCode) return;
    void loadConfig(countryCode);
  }, [countryCode, loadConfig]);

  async function handleSave() {
    if (!countryCode) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/recipient-currency-configs", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          usdEnabled: localIsUsd ? true : usdEnabled,
          eurEnabled: localIsEur ? true : eurEnabled,
          gbpEnabled: localIsGbp ? true : gbpEnabled,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: json?.message || "Failed to save.",
        });
        return;
      }
      const data = json.data as RecipientCurrencyConfig;
      setLocalCurrency(data.localCurrency);
      setUsdEnabled(data.usdEnabled);
      setEurEnabled(data.eurEnabled);
      setGbpEnabled(data.gbpEnabled);
      setMessage({ kind: "ok", text: "Recipient currencies saved." });
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Recipient Currency
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose which currencies customers can receive in &quot;What they
          get&quot; for each allowed payout country. The local currency is
          always available; other majors can be turned on or off.
        </p>
      </div>

      {countriesError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {countriesError}
        </div>
      ) : null}

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="max-w-sm">
        <AdminCountrySelect
          label="Recipient country"
          value={countryCode}
          onChange={setCountryCode}
          countries={countries}
          loading={sessionLoading || countriesLoading}
          placeholder="Select country…"
        />
      </div>

      {countryCode ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              What they get options
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {configLoading
                ? "Loading…"
                : `When sending to ${selectedCountry?.couName ?? countryCode}, customers can receive in the currencies below.`}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-not-allowed opacity-90">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked
                disabled
                readOnly
              />
              <span className="text-sm text-slate-800">
                <span className="font-medium">{localCurrency}</span>
                <span className="text-slate-500 ml-1">
                  (local currency — always available)
                </span>
              </span>
            </label>

            {!localIsUsd ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={usdEnabled}
                  disabled={configLoading || saving}
                  onChange={(e) => setUsdEnabled(e.target.checked)}
                />
                <span className="text-sm text-slate-800">
                  <span className="font-medium">USD</span>
                </span>
              </label>
            ) : null}

            {!localIsEur ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={eurEnabled}
                  disabled={configLoading || saving}
                  onChange={(e) => setEurEnabled(e.target.checked)}
                />
                <span className="text-sm text-slate-800">
                  <span className="font-medium">EUR</span>
                </span>
              </label>
            ) : null}

            {!localIsGbp ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={gbpEnabled}
                  disabled={configLoading || saving}
                  onChange={(e) => setGbpEnabled(e.target.checked)}
                />
                <span className="text-sm text-slate-800">
                  <span className="font-medium">GBP</span>
                </span>
              </label>
            ) : null}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={configLoading || saving || !countryCode}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
