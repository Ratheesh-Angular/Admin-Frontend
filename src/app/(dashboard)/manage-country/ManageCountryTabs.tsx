"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminCountrySelect } from "@/components/country/AdminCountrySelect";
import {
  fetchRegistrationCountries,
  parseFlexCountryRows,
  type CountryRow as RegCountryRow,
} from "@/lib/registration-countries";
import {
  CountryCheckboxList,
  type CountryRow,
} from "./CountryCheckboxList";
import {
  filterToUnlockedCodes,
  MANAGE_COUNTRY_UNLOCKED_SET,
} from "./unlocked-countries";

type TabId = "registration" | "platform";

function parseFlexRows(res: { data?: unknown }): CountryRow[] {
  return parseFlexCountryRows(res);
}

function parseCatalogSelection(res: { data?: unknown }): Set<string> {
  const countries = (res as { data?: { countries?: { couCode?: string }[] } })
    ?.data?.countries;
  if (!Array.isArray(countries)) return new Set();
  return new Set(
    countries
      .map((c) => String(c.couCode ?? "").trim().toUpperCase())
      .filter(Boolean),
  );
}

export function ManageCountryTabs() {
  const { session, loading: sessionLoading } = useAdminSession();
  const canEditOperationCountries = session?.role === "SUPER_ADMIN";
  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const assignedCodes = useMemo(
    () => session?.countryCodes ?? [],
    [session?.countryCodes],
  );

  const [tab, setTab] = useState<TabId>("platform");
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [registrationSelected, setRegistrationSelected] = useState<Set<string>>(
    new Set(),
  );
  const [platformSelected, setPlatformSelected] = useState<Set<string>>(
    new Set(),
  );
  const [opCountries, setOpCountries] = useState<RegCountryRow[]>([]);
  const [opCountriesLoading, setOpCountriesLoading] = useState(true);
  const [operationCountryCode, setOperationCountryCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const showCountrySelect =
    Boolean(session) && (isSuperAdmin || assignedCodes.length > 1);

  const countryOptions = useMemo(() => {
    if (!session) return [];
    if (isSuperAdmin) return opCountries;
    const allowed = new Set(assignedCodes);
    return opCountries.filter((c) => allowed.has(c.couCode));
  }, [session, isSuperAdmin, opCountries, assignedCodes]);

  const loadMasterAndAllowlist = useCallback(async () => {
    const [allRes, allowlistRes] = await Promise.all([
      fetch("/api/admin/flex-countries"),
      fetch("/api/admin/country-allowlist"),
    ]);
    const allJson = await allRes.json();
    const allowlistJson = await allowlistRes.json();
    if (!allRes.ok) {
      throw new Error(allJson.error || "Failed to load countries");
    }
    setRows(parseFlexRows(allJson));
    const allowCodes =
      (allowlistJson?.data?.couCodes as string[] | undefined) ?? [];
    setRegistrationSelected(new Set(filterToUnlockedCodes(allowCodes)));
  }, []);

  const loadPayoutForCountry = useCallback(async (countryCode: string) => {
    if (!countryCode) {
      setPlatformSelected(new Set());
      return;
    }
    const r = await fetch(
      `/api/admin/catalog-countries?countryCode=${encodeURIComponent(countryCode)}`,
      { credentials: "same-origin" },
    );
    const j = await r.json();
    if (!r.ok) {
      throw new Error(j.error || j.message || "Failed to load payout countries");
    }
    setPlatformSelected(
      new Set(filterToUnlockedCodes(parseCatalogSelection(j))),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOpCountries() {
      if (sessionLoading) return;
      if (!session) {
        setOpCountries([]);
        setOpCountriesLoading(false);
        return;
      }
      setOpCountriesLoading(true);
      try {
        if (isSuperAdmin) {
          const rows = await fetchRegistrationCountries();
          if (!cancelled) setOpCountries(rows);
          return;
        }
        const res = await fetch("/api/admin/flex-countries", {
          credentials: "same-origin",
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Failed to load countries");
        }
        if (!cancelled) setOpCountries(parseFlexCountryRows(json));
      } catch {
        if (!cancelled) setOpCountries([]);
      } finally {
        if (!cancelled) setOpCountriesLoading(false);
      }
    }
    void loadOpCountries();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading, isSuperAdmin]);

  useEffect(() => {
    if (!session) return;
    if (!isSuperAdmin && assignedCodes.length === 1) {
      setOperationCountryCode(assignedCodes[0]!);
      return;
    }
    if (countryOptions.length === 0) return;
    setOperationCountryCode((prev) => {
      if (prev && countryOptions.some((c) => c.couCode === prev)) return prev;
      return countryOptions[0]!.couCode;
    });
  }, [session, isSuperAdmin, assignedCodes, countryOptions]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      await loadMasterAndAllowlist();
      if (operationCountryCode) {
        await loadPayoutForCountry(operationCountryCode);
      }
    } catch (err) {
      setMessage({
        kind: "err",
        text: err instanceof Error ? err.message : "Network error",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [loadMasterAndAllowlist, loadPayoutForCountry, operationCountryCode]);

  useEffect(() => {
    if (sessionLoading || !session) return;
    void load();
  }, [load, session, sessionLoading]);

  useEffect(() => {
    if (tab !== "platform" || !operationCountryCode || !session) return;
    let cancelled = false;
    async function reloadPayout() {
      setLoading(true);
      setMessage(null);
      try {
        await loadPayoutForCountry(operationCountryCode);
      } catch (err) {
        if (!cancelled) {
          setMessage({
            kind: "err",
            text: err instanceof Error ? err.message : "Network error",
          });
          setPlatformSelected(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void reloadPayout();
    return () => {
      cancelled = true;
    };
  }, [operationCountryCode, tab, session, loadPayoutForCountry]);

  async function saveRegistration() {
    if (!canEditOperationCountries) return;
    setSaving(true);
    setMessage(null);
    try {
      const couCodes = filterToUnlockedCodes(registrationSelected);
      const r = await fetch("/api/admin/country-allowlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couCodes }),
      });
      const j = await r.json();
      if (!r.ok) {
        setMessage({
          kind: "err",
          text: j.error || j.message || "Save failed",
        });
        return;
      }
      setRegistrationSelected(new Set(filterToUnlockedCodes(couCodes)));
      setMessage({
        kind: "ok",
        text:
          couCodes.length === 0
            ? "Cleared — customers will see all Flex countries again."
            : `Saved ${couCodes.length} countr${couCodes.length === 1 ? "y" : "ies"} of operation.`,
      });
    } catch {
      setMessage({ kind: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  async function savePlatform() {
    if (!operationCountryCode) return;
    setSaving(true);
    setMessage(null);
    try {
      const couCodes = filterToUnlockedCodes(platformSelected).filter((c) =>
        rows.some((r) => r.couCode === c),
      );
      const r = await fetch("/api/admin/catalog-countries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: operationCountryCode,
          couCodes,
        }),
        credentials: "same-origin",
      });
      const j = await r.json();
      if (!r.ok) {
        setMessage({
          kind: "err",
          text: j.error || j.message || "Save failed",
        });
        return;
      }
      setPlatformSelected(
        new Set(filterToUnlockedCodes(parseCatalogSelection(j))),
      );
      setMessage({
        kind: "ok",
        text:
          couCodes.length === 0
            ? `Cleared — no payout countries for ${operationCountryCode}.`
            : `Saved ${couCodes.length} payout countr${couCodes.length === 1 ? "y" : "ies"} for ${operationCountryCode}.`,
      });
    } catch {
      setMessage({ kind: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    {
      id: "registration" as const,
      label: "Countries of Operation",
      description:
        "Controls which countries appear on the customer registration page.",
    },
    {
      id: "platform" as const,
      label: "Payout Countries",
      description:
        "Select an operation country, then enable payout destinations for customers in that country only.",
    },
  ] satisfies { id: TabId; label: string; description: string }[];

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0]!;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSearch("");
                setMessage(null);
              }}
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

      <p className="text-sm text-slate-500">{activeTab.description}</p>

      {tab === "registration" ? (
        <CountryCheckboxList
          rows={rows}
          selected={registrationSelected}
          onSelectedChange={setRegistrationSelected}
          unlockedCodes={MANAGE_COUNTRY_UNLOCKED_SET}
          loading={loading}
          saving={saving}
          readOnly={!canEditOperationCountries}
          search={search}
          onSearchChange={setSearch}
          onReload={() => void load()}
          onSave={() => void saveRegistration()}
          message={message}
          helperText={
            canEditOperationCountries
              ? "Only unlocked corridors (UGA, KEN, TZA, SSD, GBR, CAN) can be toggled. Checked ones appear as countries of operation. Uncheck all and save to show the full catalog again."
              : "Only super admins can change countries of operation."
          }
          emptySelectionHint={
            canEditOperationCountries
              ? "No unlocked corridors selected — the full country catalog is shown."
              : "Only super admins can change countries of operation."
          }
        />
      ) : (
        <div className="space-y-4">
          {showCountrySelect ? (
            <div className="max-w-sm">
              <AdminCountrySelect
                label="Country of operation"
                value={operationCountryCode}
                onChange={(code) => {
                  setOperationCountryCode(code);
                  setSearch("");
                  setMessage(null);
                }}
                countries={countryOptions}
                loading={opCountriesLoading}
                placeholder="Select country…"
              />
            </div>
          ) : null}
          {!operationCountryCode && !opCountriesLoading ? (
            <p className="text-sm text-slate-500">
              No operation country available for your account.
            </p>
          ) : (
            <CountryCheckboxList
              rows={rows}
              selected={platformSelected}
              onSelectedChange={setPlatformSelected}
              unlockedCodes={MANAGE_COUNTRY_UNLOCKED_SET}
              loading={loading || opCountriesLoading}
              saving={saving}
              search={search}
              onSearchChange={setSearch}
              onReload={() => void load()}
              onSave={() => void savePlatform()}
              message={message}
              helperText={`Payout destinations for ${operationCountryCode || "…"}. Only unlocked corridors can be toggled.`}
              emptySelectionHint={`No payout countries enabled for ${operationCountryCode || "this country"} — customers from this country will see an empty destination list until you select and save.`}
            />
          )}
        </div>
      )}
    </div>
  );
}
