"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminCountrySelect } from "@/components/country/AdminCountrySelect";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  fetchRegistrationCountries,
  parseFlexCountryRows,
  type CountryRow,
} from "@/lib/registration-countries";

type PayInMethodConfig = {
  countryCode: string;
  bankTransferEnabled: boolean;
  mobileMoneyEnabled: boolean;
  cardEnabled: boolean;
  persisted: boolean;
};

export function PayInMethodsClient() {
  const { session, loading: sessionLoading } = useAdminSession();

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");

  const [bankTransferEnabled, setBankTransferEnabled] = useState(true);
  const [mobileMoneyEnabled, setMobileMoneyEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const assignedCodes = useMemo(
    () => session?.countryCodes ?? [],
    [session?.countryCodes],
  );

  const showCountrySelect =
    Boolean(session) && (isSuperAdmin || assignedCodes.length > 1);

  const countryOptions = useMemo(() => {
    if (!session) return [];
    if (isSuperAdmin) return countries;
    const allowed = new Set(assignedCodes);
    return countries.filter((c) => allowed.has(c.couCode));
  }, [session, isSuperAdmin, countries, assignedCodes]);

  const selectedCountry = useMemo(
    () => countryOptions.find((c) => c.couCode === countryCode) ?? null,
    [countryOptions, countryCode],
  );

  const enabledCount =
    Number(bankTransferEnabled) +
    Number(mobileMoneyEnabled) +
    Number(cardEnabled);

  const canToggleBankOff = enabledCount > 1 || !bankTransferEnabled;
  const canToggleMobileOff = enabledCount > 1 || !mobileMoneyEnabled;
  const canToggleCardOff = enabledCount > 1 || !cardEnabled;

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
        if (isSuperAdmin) {
          const rows = await fetchRegistrationCountries();
          if (!cancelled) setCountries(rows);
          return;
        }

        const res = await fetch("/api/admin/flex-countries", {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load countries");
        }
        if (!cancelled) setCountries(parseFlexCountryRows(json));
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
  }, [session, sessionLoading, isSuperAdmin]);

  useEffect(() => {
    if (!session) return;

    if (!isSuperAdmin && assignedCodes.length === 1) {
      setCountryCode(assignedCodes[0]);
      return;
    }

    if (countryOptions.length === 0) return;

    setCountryCode((prev) => {
      if (prev && countryOptions.some((c) => c.couCode === prev)) return prev;
      return countryOptions[0].couCode;
    });
  }, [session, isSuperAdmin, assignedCodes, countryOptions]);

  const loadConfig = useCallback(async (code: string) => {
    if (!code) return;
    setConfigLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/pay-in-method-configs?countryCode=${encodeURIComponent(code)}`,
        { credentials: "same-origin" },
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || "Failed to load pay-in methods.");
      }
      const data = json.data as PayInMethodConfig;
      setBankTransferEnabled(data.bankTransferEnabled);
      setMobileMoneyEnabled(data.mobileMoneyEnabled);
      setCardEnabled(data.cardEnabled);
    } catch (err) {
      setMessage({
        kind: "err",
        text:
          err instanceof Error
            ? err.message
            : "Failed to load pay-in methods.",
      });
      setBankTransferEnabled(true);
      setMobileMoneyEnabled(true);
      setCardEnabled(false);
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
    if (!bankTransferEnabled && !mobileMoneyEnabled && !cardEnabled) {
      setMessage({
        kind: "err",
        text: "Select at least one payment method.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pay-in-method-configs", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          bankTransferEnabled,
          mobileMoneyEnabled,
          cardEnabled,
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
      const data = json.data as PayInMethodConfig;
      setBankTransferEnabled(data.bankTransferEnabled);
      setMobileMoneyEnabled(data.mobileMoneyEnabled);
      setCardEnabled(data.cardEnabled);
      setMessage({ kind: "ok", text: "Pay-in methods saved." });
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
          Pay-in Methods
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose which &quot;How you pay us&quot; options customers see on Send
          money for each country of operation. At least one method must stay
          enabled.
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

      {showCountrySelect ? (
        <div className="max-w-sm">
          <AdminCountrySelect
            label="Country of operation"
            value={countryCode}
            onChange={setCountryCode}
            countries={countryOptions}
            loading={sessionLoading || countriesLoading}
            placeholder="Select country…"
          />
        </div>
      ) : selectedCountry || countryCode ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Country
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {selectedCountry?.couName ?? countryCode}
            {selectedCountry ? (
              <span className="ml-2 text-slate-500 font-normal">
                ({selectedCountry.couCode})
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

      {countryCode ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              How you pay us options
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {configLoading
                ? "Loading…"
                : `Customers registered in ${selectedCountry?.couName ?? countryCode} can use the methods below.`}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={bankTransferEnabled}
                disabled={configLoading || saving || !canToggleBankOff}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (
                    !next &&
                    !mobileMoneyEnabled &&
                    !cardEnabled
                  ) {
                    return;
                  }
                  setBankTransferEnabled(next);
                }}
              />
              <span className="text-sm font-medium text-slate-800">
                Bank transfer
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={mobileMoneyEnabled}
                disabled={configLoading || saving || !canToggleMobileOff}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (
                    !next &&
                    !bankTransferEnabled &&
                    !cardEnabled
                  ) {
                    return;
                  }
                  setMobileMoneyEnabled(next);
                }}
              />
              <span className="text-sm font-medium text-slate-800">
                Mobile money
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={cardEnabled}
                disabled={configLoading || saving || !canToggleCardOff}
                onChange={(e) => {
                  const next = e.target.checked;
                  if (
                    !next &&
                    !bankTransferEnabled &&
                    !mobileMoneyEnabled
                  ) {
                    return;
                  }
                  setCardEnabled(next);
                }}
              />
              <span className="text-sm font-medium text-slate-800">
                Pay by debit/credit card
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={
                configLoading ||
                saving ||
                !countryCode ||
                enabledCount === 0
              }
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
