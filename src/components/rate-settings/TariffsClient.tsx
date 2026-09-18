"use client";

import { useEffect, useMemo, useState } from "react";
import { RateSettingsPageShell } from "./RateSettingsPageShell";
import { TariffPanel } from "./TariffPanel";
import { AdminCountrySelect } from "@/components/country/AdminCountrySelect";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  fetchRegistrationCountries,
  parseFlexCountryRows,
  type CountryRow,
} from "@/lib/registration-countries";

type TabId = "individual" | "corporate";

const tabs: { id: TabId; label: string; audience: "INDIVIDUAL" | "CORPORATE" }[] =
  [
    { id: "individual", label: "Tariff (Individuals)", audience: "INDIVIDUAL" },
    { id: "corporate", label: "Tariff (Corporates)", audience: "CORPORATE" },
  ];

export function TariffsClient() {
  const [tab, setTab] = useState<TabId>("individual");
  const active = tabs.find((t) => t.id === tab)!;
  const { session, loading: sessionLoading } = useAdminSession();

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");

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

  return (
    <RateSettingsPageShell
      title="Tariffs"
      description="Set transfer fees by sender country, currency pair, and customer segment."
    >
      <div className="space-y-6">
        {countriesError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {countriesError}
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
        ) : null}

        <div className="border-b border-slate-200">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <TariffPanel
          key={active.audience}
          audience={active.audience}
          countryCode={countryCode}
          countryReady={Boolean(countryCode) && !sessionLoading}
        />
      </div>
    </RateSettingsPageShell>
  );
}
