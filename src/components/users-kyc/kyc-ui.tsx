import type { ReactNode } from "react";

export function fmtDate(v: string | Date | null | undefined): string {
  if (v == null) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function residenceDetailRows(
  individual: Record<string, unknown> | null | undefined,
): { label: string; value: string }[] {
  const r = individual?.residenceAddress;
  if (r && typeof r === "object" && !Array.isArray(r)) {
    const o = r as Record<string, unknown>;
    const rows: { label: string; value: string }[] = [];
    const line1 = String(o.line1 ?? "").trim();
    const line2 = String(o.line2 ?? "").trim();
    const city = String(o.city ?? "").trim();
    const state = String(o.state ?? "").trim();
    const postal = String(o.postalCode ?? "").trim();
    if (line1) rows.push({ label: "Address line 1", value: line1 });
    if (line2) rows.push({ label: "Address line 2", value: line2 });
    if (city) rows.push({ label: "City", value: city });
    if (state) rows.push({ label: "State", value: state });
    if (postal) rows.push({ label: "Postal code", value: postal });
    if (rows.length) return rows;
  }
  const legacy = individual?.residentialAddress;
  if (legacy != null && String(legacy).trim()) {
    return [{ label: "Residential address", value: String(legacy) }];
  }
  return [];
}

function parseStoredBusinessAddressLines(o: Record<string, unknown>): string {
  const line1 = String(o.line1 ?? "").trim();
  const line2 = String(o.line2 ?? "").trim();
  const city = String(o.city ?? "").trim();
  const state = String(o.state ?? "").trim();
  const postal = String(o.postalCode ?? "").trim();
  const country = String(o.country ?? "").trim();
  const cityState = [city, state].filter(Boolean).join(", ");
  return [line1, line2, cityState, postal, country].filter(Boolean).join("\n");
}

export function formatCorporateBusinessAddress(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if ("line1" in o || "city" in o || "country" in o || "postalCode" in o) {
      const formatted = parseStoredBusinessAddressLines(o);
      if (formatted) return formatted;
    }
  }
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "";
  try {
    const j = JSON.parse(s) as unknown;
    if (j && typeof j === "object" && !Array.isArray(j)) {
      const formatted = parseStoredBusinessAddressLines(
        j as Record<string, unknown>,
      );
      if (formatted) return formatted;
    }
  } catch {
    /* legacy text */
  }
  return s;
}

export function normalizeSubmittedProfileArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const j = JSON.parse(value) as unknown;
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function KycBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    IN_PROGRESS: "bg-sky-50 text-sky-800 ring-sky-200",
    SUBMITTED: "bg-blue-50 text-blue-800 ring-blue-200",
    APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    REJECTED: "bg-red-50 text-red-800 ring-red-200",
    SUSPENDED: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const labels: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "Verification in progress",
    SUBMITTED: "Under review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${map[status] ?? "bg-slate-50 text-slate-700 ring-slate-200"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-800",
    APPROVED: "bg-emerald-50 text-emerald-800",
    REJECTED: "bg-red-50 text-red-800",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-md ${map[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

export function DetailRow({
  label,
  value,
  wide,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`grid gap-1 py-3 border-b border-slate-100 last:border-0 sm:grid-cols-3 sm:gap-4 ${wide ? "sm:items-start" : "sm:items-center"}`}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd
        className={`text-sm text-slate-900 sm:col-span-2 ${wide ? "whitespace-pre-wrap break-words" : ""}`}
      >
        {value === "" || value == null ? (
          <span className="text-slate-400">Not provided</span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description ? (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-5 py-2">{children}</div>
    </section>
  );
}
