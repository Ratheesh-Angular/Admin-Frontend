/**
 * Client-side mirror of backend admin currency-pair access rules.
 * ADMIN: base country must be assigned (e.g. KES - AED), or USD - assigned country.
 * Prefer API-filtered lists; use this only when filtering locally.
 */
export type AdminScopeClient = {
  role: "SUPER_ADMIN" | "ADMIN";
  countryCodes: string[];
};

export type CurrencyPairAccessClient = {
  baseCountryCode: string;
  quoteCountryCode: string;
  baseCurrency: string;
};

function normalizeCouCode(code: string): string {
  return code.trim().toUpperCase();
}

export function canAccessCurrencyPairClient(
  scope: AdminScopeClient,
  pair: CurrencyPairAccessClient,
): boolean {
  if (scope.role === "SUPER_ADMIN") return true;

  const codes = new Set(scope.countryCodes.map(normalizeCouCode));
  if (codes.size === 0) return false;

  const base = normalizeCouCode(pair.baseCountryCode);
  const quote = normalizeCouCode(pair.quoteCountryCode);

  if (codes.has(base)) return true;

  if (pair.baseCurrency.trim().toUpperCase() === "USD" && codes.has(quote)) {
    return true;
  }

  return false;
}

export function filterCurrencyPairsForAdminClient<
  T extends CurrencyPairAccessClient,
>(pairs: T[], scope: AdminScopeClient): T[] {
  if (scope.role === "SUPER_ADMIN") return pairs;
  return pairs.filter((pair) => canAccessCurrencyPairClient(scope, pair));
}
