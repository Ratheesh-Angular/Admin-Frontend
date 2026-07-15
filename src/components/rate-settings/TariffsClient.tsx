"use client";

import { useState } from "react";
import { RateSettingsPageShell } from "./RateSettingsPageShell";
import { TariffPanel } from "./TariffPanel";

type TabId = "individual" | "corporate";

const tabs: { id: TabId; label: string; audience: "INDIVIDUAL" | "CORPORATE" }[] = [
  { id: "individual", label: "Tariff (Individuals)", audience: "INDIVIDUAL" },
  { id: "corporate", label: "Tariff (Corporates)", audience: "CORPORATE" },
];

export function TariffsClient() {
  const [tab, setTab] = useState<TabId>("individual");
  const active = tabs.find((t) => t.id === tab)!;

  return (
    <RateSettingsPageShell
      title="Tariffs"
      description="Set transfer fees by currency pair and customer segment."
    >
      <div className="space-y-6">
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

        <TariffPanel key={active.audience} audience={active.audience} />
      </div>
    </RateSettingsPageShell>
  );
}
