export const COU_CODE_TO_CURRENCY: Record<string, string> = {
  AFG: "AFN",
  DZA: "DZD",
  AUS: "AUD",
  AZE: "AZN",
  BHR: "BHD",
  BGD: "BDT",
  BLR: "BYN",
  BRA: "BRL",
  BGR: "BGN",
  KHM: "KHR",
  CMR: "XAF",
  CAN: "CAD",
  CHN: "CNY",
  COD: "CDF",
  CZE: "CZK",
  EGY: "EGP",
  EST: "EUR",
  ETH: "ETB",
  FIN: "EUR",
  FRA: "EUR",
  DEU: "EUR",
  GRC: "EUR",
  HKG: "HKD",
  HUN: "HUF",
  IND: "INR",
  IDN: "IDR",
  ITA: "EUR",
  JPN: "JPY",
  KEN: "KES",
  KWT: "KWD",
  LVA: "EUR",
  LTU: "EUR",
  MDG: "MGA",
  MWI: "MWK",
  MYS: "MYR",
  MDA: "MDL",
  MAR: "MAD",
  NPL: "NPR",
  NLD: "EUR",
  NGA: "NGN",
  PAK: "PKR",
  PHL: "PHP",
  POL: "PLN",
  ROU: "RON",
  RUS: "RUB",
  SEN: "XOF",
  SGP: "SGD",
  SVK: "EUR",
  ZAF: "ZAR",
  ESP: "EUR",
  LKA: "LKR",
  SWE: "SEK",
  CHE: "CHF",
  TZA: "TZS",
  THA: "THB",
  UKR: "UAH",
  ARE: "AED",
  GBR: "GBP",
  USA: "USD",
  ZMB: "ZMW",
  SSD: "SSP",
  UGA: "UGX",
  BEL: "EUR",
  CYP: "EUR",
  DNK: "DKK",
  IRL: "EUR",
  LUX: "EUR",
  NOR: "NOK",
  PRT: "EUR",
  SOM: "SOS",
  LBN: "LBP",
  ERI: "ERN",
  QAT: "QAR",
  BEN: "XOF",
  BMU: "BMD",
  BFA: "XOF",
  BDI: "BIF",
  COG: "XAF",
  GEO: "GEL",
  GHA: "GHS",
  CIV: "XOF",
  KAZ: "KZT",
  KGZ: "KGS",
  LBR: "LRD",
  MLT: "EUR",
  MTQ: "EUR",
  MCO: "EUR",
  NAM: "NAD",
  NZL: "NZD",
  NER: "XOF",
  RWA: "RWF",
  SMR: "EUR",
  SLE: "SLE",
  SVN: "EUR",
  TJK: "TJS",
  UZB: "UZS",
  VNM: "VND",
  ZWE: "ZWL",
  ALB: "ALL",
  AND: "EUR",
  ARM: "AMD",
  AUT: "EUR",
  BIH: "BAM",
  HRV: "EUR",
  ISL: "ISK",
  LIE: "CHF",
  MNE: "EUR",
  MKD: "MKD",
  SRB: "RSD",
  VAT: "EUR",
};

export function legalCurrencyForCouCode(couCode: string): string {
  const a3 = couCode?.trim().toUpperCase();
  if (!a3) return "USD";
  return COU_CODE_TO_CURRENCY[a3] ?? "USD";
}

/** Preferred ISO3 country when several platform countries share a currency. */
export const CURRENCY_CANONICAL_COUNTRY: Record<string, string> = {
  EUR: "DEU",
  XOF: "SEN",
  XAF: "CMR",
  CHF: "CHE",
  USD: "USA",
};

/**
 * Flag code for currency UIs (flagcdn alpha-2 / special).
 * EUR uses the EU flag instead of a single eurozone country.
 */
export function flagCouCodeForCurrency(
  currencyCode: string,
  fallbackCouCode: string,
): string {
  if (currencyCode.trim().toUpperCase() === "EUR") return "EU";
  return fallbackCouCode;
}

export type PlatformCurrencyOption = {
  couCode: string;
  couName: string;
  currencyCode: string;
};

export function toPlatformCurrencyOptions(
  countries: { couCode: string; couName: string }[],
): PlatformCurrencyOption[] {
  return countries
    .map((c) => ({
      couCode: c.couCode.toUpperCase(),
      couName: c.couName,
      currencyCode: legalCurrencyForCouCode(c.couCode),
    }))
    .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
}

/**
 * Pick a stable display country for a currency among platform countries.
 * Prefers CURRENCY_CANONICAL_COUNTRY when that country is present; else first alpha.
 */
export function canonicalCouCodeForCurrency(
  currencyCode: string,
  platformCountries: { couCode: string; couName: string }[],
): string | null {
  const currency = currencyCode.trim().toUpperCase();
  if (!currency) return null;

  const matching = platformCountries
    .map((c) => ({
      couCode: c.couCode.trim().toUpperCase(),
      couName: c.couName,
    }))
    .filter((c) => c.couCode && legalCurrencyForCouCode(c.couCode) === currency)
    .sort((a, b) => a.couCode.localeCompare(b.couCode));

  if (matching.length === 0) return null;

  const preferred = CURRENCY_CANONICAL_COUNTRY[currency];
  if (preferred && matching.some((c) => c.couCode === preferred)) {
    return preferred;
  }
  return matching[0].couCode;
}

/** One option per currency code (canonical country for flags). */
export function dedupePlatformCurrenciesByCode(
  options: PlatformCurrencyOption[],
): PlatformCurrencyOption[] {
  const byCurrency = new Map<string, PlatformCurrencyOption[]>();
  for (const option of options) {
    const code = option.currencyCode.trim().toUpperCase();
    const list = byCurrency.get(code) ?? [];
    list.push({
      ...option,
      couCode: option.couCode.toUpperCase(),
      currencyCode: code,
    });
    byCurrency.set(code, list);
  }

  const deduped: PlatformCurrencyOption[] = [];
  for (const [currency, list] of byCurrency) {
    const countries = list.map((o) => ({
      couCode: o.couCode,
      couName: o.couName,
    }));
    const canonical = canonicalCouCodeForCurrency(currency, countries);
    const chosen =
      list.find((o) => o.couCode === canonical) ??
      [...list].sort((a, b) => a.couCode.localeCompare(b.couCode))[0];
    deduped.push(chosen);
  }

  return deduped.sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
}
