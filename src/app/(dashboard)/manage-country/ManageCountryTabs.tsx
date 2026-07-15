"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CountryCheckboxList,
  type CountryRow,
} from "./CountryCheckboxList";

type TabId = "registration" | "platform";

function parseFlexRows(res: { data?: unknown }): CountryRow[] {
  const flexBody = res?.data;
  const inner = flexBody as { data?: { data?: unknown } } | undefined;
  const arr = Array.isArray(inner?.data?.data)
    ? inner!.data!.data
    : Array.isArray((flexBody as { data?: unknown[] })?.data)
      ? (flexBody as { data: unknown[] }).data
      : [];
  return (arr as unknown[])
    .map((r) => ({
      couCode: String((r as CountryRow).couCode ?? "").trim().toUpperCase(),
      couName: String((r as CountryRow).couName ?? "").trim(),
    }))
    .filter((r) => r.couCode && r.couName);
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
  const [tab, setTab] = useState<TabId>("registration");
  const [rows, setRows] = useState<CountryRow[]>([]);
  const [registrationSelected, setRegistrationSelected] = useState<Set<string>>(
    new Set(),
  );
  const [platformSelected, setPlatformSelected] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [allRes, allowlistRes, catalogRes] = await Promise.all([
        fetch("/api/admin/flex-countries"),
        fetch("/api/admin/country-allowlist"),
        fetch("/api/admin/catalog-countries"),
      ]);
      const allJson = await allRes.json();
      const allowlistJson = await allowlistRes.json();
      const catalogJson = await catalogRes.json();

      if (!allRes.ok) {
        setMessage({
          kind: "err",
          text: allJson.error || "Failed to load countries",
        });
        setRows([]);
        return;
      }

      setRows(parseFlexRows(allJson));
      const pickerCodes = new Set(parseFlexRows(allJson).map((r) => r.couCode));
      const allowCodes =
        (allowlistJson?.data?.couCodes as string[] | undefined) ?? [];
      setRegistrationSelected(new Set(allowCodes.map((c) => c.toUpperCase())));
      setPlatformSelected(
        new Set(
          [...parseCatalogSelection(catalogJson)].filter((c) =>
            pickerCodes.has(c),
          ),
        ),
      );
    } catch {
      setMessage({ kind: "err", text: "Network error" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRegistration() {
    setSaving(true);
    setMessage(null);
    try {
      const couCodes = Array.from(registrationSelected);
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
      setMessage({
        kind: "ok",
        text:
          couCodes.length === 0
            ? "Cleared — customers will see all Flex countries on registration again."
            : `Saved ${couCodes.length} registration countr${couCodes.length === 1 ? "y" : "ies"}.`,
      });
    } catch {
      setMessage({ kind: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  async function savePlatform() {
    setSaving(true);
    setMessage(null);
    try {
      const couCodes = Array.from(platformSelected).filter((c) =>
        rows.some((r) => r.couCode === c),
      );
      const r = await fetch("/api/admin/catalog-countries", {
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
      setPlatformSelected(parseCatalogSelection(j));
      setMessage({
        kind: "ok",
        text:
          couCodes.length === 0
            ? "Cleared — no platform countries are enabled."
            : `Saved ${couCodes.length} platform countr${couCodes.length === 1 ? "y" : "ies"}.`,
      });
    } catch {
      setMessage({ kind: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: TabId; label: string; description: string }[] = [
    {
      id: "registration",
      label: "Registration countries",
      description:
        "Controls which countries appear on the customer registration page.",
    },
    {
      id: "platform",
      label: "Platform countries",
      description:
        "Controls the country catalog used for beneficiaries, currency pairs, tariffs, and other payment features.",
    },
  ];

  const activeTab = tabs.find((t) => t.id === tab)!;

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
          loading={loading}
          saving={saving}
          search={search}
          onSearchChange={setSearch}
          onReload={() => void load()}
          onSave={() => void saveRegistration()}
          message={message}
          helperText="Only checked countries are shown on customer registration. Uncheck all and save to show the full catalog again."
          emptySelectionHint="No selection saved — registration shows the full country catalog."
        />
      ) : (
        <CountryCheckboxList
          rows={rows}
          selected={platformSelected}
          onSelectedChange={setPlatformSelected}
          loading={loading}
          saving={saving}
          search={search}
          onSearchChange={setSearch}
          onReload={() => void load()}
          onSave={() => void savePlatform()}
          message={message}
          helperText="Only checked countries are enabled for platform features (beneficiaries, send money, KYC, currency pairs, etc.)."
          emptySelectionHint="No countries enabled — platform country selectors will be empty until you select and save."
        />
      )}
    </div>
  );
}
