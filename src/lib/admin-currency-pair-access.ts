/**
 * Client-side mirror of backend admin currency-pair access rules.
 * ADMIN: base currency must match an assigned country's currency (e.g. KES - AED
 * or EUR - AED), or USD - assigned currency.
 * Prefer API-filtered lists; use this only when filtering locally.
 */
import { legalCurrencyForCouCode } from "@/lib/country-currency";

export type AdminScopeClient = {
  role: "SUPER_ADMIN" | "ADMIN";
  countryCodes: string[];
};

export type CurrencyPairAccessClient = {
  baseCountryCode: string;
  quoteCountryCode: string;
  baseCurrency: string;
  quoteCurrency: string;
};

function normalizeCouCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeCurrency(code: string): string {
  return code.trim().toUpperCase();
}

export function canAccessCurrencyPairClient(
  scope: AdminScopeClient,
  pair: CurrencyPairAccessClient,
): boolean {
  if (scope.role === "SUPER_ADMIN") return true;

  const codes = new Set(scope.countryCodes.map(normalizeCouCode));
  if (codes.size === 0) return false;

  const adminCurrencies = new Set(
    [...codes].map((code) => legalCurrencyForCouCode(code)),
  );

  const baseCurrency = normalizeCurrency(pair.baseCurrency);
  const quoteCurrency = normalizeCurrency(pair.quoteCurrency);

  if (adminCurrencies.has(baseCurrency)) return true;

  if (
    baseCurrency === "USD" &&
    (adminCurrencies.has(quoteCurrency) ||
      codes.has(normalizeCouCode(pair.quoteCountryCode)))
  ) {
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
