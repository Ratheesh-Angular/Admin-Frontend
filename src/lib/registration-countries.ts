export type CountryRow = { couCode: string; couName: string };

export function parseFlexCountryRows(res: { data?: unknown }): CountryRow[] {
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
    .filter((r) => r.couCode && r.couName)
    .sort((a, b) => a.couName.localeCompare(b.couName));
}

/** Registration-enabled countries: full master list or allowlist subset. */
export function filterRegistrationCountries(
  all: CountryRow[],
  allowlistCodes: string[],
): CountryRow[] {
  if (!allowlistCodes.length) return all;
  const allowed = new Set(allowlistCodes.map((c) => c.toUpperCase()));
  return all.filter((r) => allowed.has(r.couCode));
}

export async function fetchRegistrationCountries(): Promise<CountryRow[]> {
  const [allRes, listRes] = await Promise.all([
    fetch("/api/admin/flex-countries"),
    fetch("/api/admin/country-allowlist"),
  ]);
  const allJson = await allRes.json();
  const listJson = await listRes.json();
  if (!allRes.ok) {
    throw new Error(
      (allJson as { error?: string }).error || "Failed to load countries",
    );
  }
  const all = parseFlexCountryRows(allJson);
  const codes = (listJson?.data?.couCodes as string[] | undefined) ?? [];
  return filterRegistrationCountries(all, codes);
}
