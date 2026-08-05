import type {
  CorridorMatrix,
  PayInByCurrencyItem,
  PayoutTopCurrencyItem,
  VolumeByCurrencyItem,
} from "./corridor-dashboard-types";
import type { OutboundTransferListRow } from "./payments/outbound-transfer-types";
import { resolveTransferReceiveCurrency } from "./payments/transfer-format";

export type CorridorTransferRow = Pick<
  OutboundTransferListRow,
  | "status"
  | "payCurrency"
  | "payAmount"
  | "receiveCurrency"
  | "receiveAmount"
  | "senderCountryIso2"
  | "beneficiary"
>;

const CURRENCY_COUNTRY: Record<string, { iso2: string; name: string }> = {
  KES: { iso2: "KE", name: "Kenya" },
  UGX: { iso2: "UG", name: "Uganda" },
  SSP: { iso2: "SS", name: "South Sudan" },
  CAD: { iso2: "CA", name: "Canada" },
  USD: { iso2: "US", name: "United States" },
  INR: { iso2: "IN", name: "India" },
  GBP: { iso2: "GB", name: "United Kingdom" },
  AED: { iso2: "AE", name: "United Arab Emirates" },
  ETB: { iso2: "ET", name: "Ethiopia" },
  NGN: { iso2: "NG", name: "Nigeria" },
  CNY: { iso2: "CN", name: "China" },
  TZS: { iso2: "TZ", name: "Tanzania" },
  EUR: { iso2: "EU", name: "Europe" },
};

function amount(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return value;
}

function modeValue(values: (string | null | undefined)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    const key = v?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

function sortByVolumeDesc(
  a: { usdVolume: number; localVolume: number },
  b: { usdVolume: number; localVolume: number },
): number {
  if (a.localVolume !== b.localVolume) return b.localVolume - a.localVolume;
  return b.usdVolume - a.usdVolume;
}

export function buildCorridorStatsFromTransfers(transfers: CorridorTransferRow[]) {
  const active = transfers.filter((t) => t.status !== "DRAFT");

  const payInMap = new Map<
    string,
    {
      localVolume: number;
      transferCount: number;
      countries: (string | null)[];
    }
  >();
  const corridorMap = new Map<string, { localPayVolume: number }>();
  const payoutMap = new Map<
    string,
    { nativeVolume: number; transferCount: number }
  >();
  const volumeMap = new Map<string, number>();

  for (const row of active) {
    const payCur = row.payCurrency?.trim().toUpperCase();
    const recvCur = resolveTransferReceiveCurrency(row);
    const payAmt = amount(row.payAmount);
    const recvAmt = amount(row.receiveAmount);

    if (payCur && payAmt > 0) {
      const entry = payInMap.get(payCur) ?? {
        localVolume: 0,
        transferCount: 0,
        countries: [],
      };
      entry.localVolume += payAmt;
      entry.transferCount += 1;
      entry.countries.push(row.senderCountryIso2);
      payInMap.set(payCur, entry);
      volumeMap.set(payCur, (volumeMap.get(payCur) ?? 0) + payAmt);
    }

    if (payCur && recvCur && payAmt > 0) {
      const key = `${payCur}|${recvCur}`;
      corridorMap.set(key, {
        localPayVolume:
          (corridorMap.get(key)?.localPayVolume ?? 0) + payAmt,
      });
    }

    if (recvCur && recvAmt > 0) {
      const entry = payoutMap.get(recvCur) ?? {
        nativeVolume: 0,
        transferCount: 0,
      };
      entry.nativeVolume += recvAmt;
      entry.transferCount += 1;
      payoutMap.set(recvCur, entry);
    }
  }

  const payInByCurrency: PayInByCurrencyItem[] = [...payInMap.entries()]
    .map(([currency, data]) => {
      const iso2 =
        modeValue(data.countries)?.toUpperCase() ??
        CURRENCY_COUNTRY[currency]?.iso2 ??
        null;
      const meta = iso2
        ? CURRENCY_COUNTRY[
            Object.keys(CURRENCY_COUNTRY).find(
              (k) => CURRENCY_COUNTRY[k].iso2 === iso2,
            ) ?? ""
          ]
        : CURRENCY_COUNTRY[currency];
      return {
        currency,
        countryIso2: iso2 ?? meta?.iso2 ?? null,
        countryName: meta?.name ?? currency,
        localVolume: data.localVolume,
        usdVolume: 0,
        transferCount: data.transferCount,
      };
    })
    .sort((a, b) => sortByVolumeDesc(
      { usdVolume: a.usdVolume, localVolume: a.localVolume },
      { usdVolume: b.usdVolume, localVolume: b.localVolume },
    ));

  const payCurrencies = [
    ...new Set([...corridorMap.keys()].map((k) => k.split("|")[0])),
  ].sort();
  const receiveCurrencies = [
    ...new Set([...corridorMap.keys()].map((k) => k.split("|")[1])),
  ].sort();

  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  const cells = [...corridorMap.entries()].map(([key, data]) => {
    const [payCurrency, receiveCurrency] = key.split("|");
    rowTotals[payCurrency] =
      (rowTotals[payCurrency] ?? 0) + data.localPayVolume;
    colTotals[receiveCurrency] =
      (colTotals[receiveCurrency] ?? 0) + data.localPayVolume;
    return {
      payCurrency,
      receiveCurrency,
      usdVolume: 0,
      localPayVolume: data.localPayVolume,
    };
  });

  const corridorMatrix: CorridorMatrix = {
    payCurrencies,
    receiveCurrencies,
    cells,
    rowTotals,
    colTotals,
  };

  const payoutTopCurrencies: PayoutTopCurrencyItem[] = [...payoutMap.entries()]
    .map(([currency, data]) => {
      const meta = CURRENCY_COUNTRY[currency];
      return {
        currency,
        countryIso2: meta?.iso2 ?? null,
        countryName: meta?.name ?? currency,
        nativeVolume: data.nativeVolume,
        usdVolume: 0,
        transferCount: data.transferCount,
      };
    })
    .sort((a, b) => sortByVolumeDesc(
      { usdVolume: a.usdVolume, localVolume: a.nativeVolume },
      { usdVolume: b.usdVolume, localVolume: b.nativeVolume },
    ))
    .slice(0, 10);

  const volumeByCurrency: VolumeByCurrencyItem[] = [...volumeMap.entries()]
    .map(([currency, localVolume]) => ({
      currency,
      localVolume,
      usdVolume: 0,
    }))
    .sort((a, b) => b.localVolume - a.localVolume);

  return {
    payInByCurrency,
    corridorMatrix,
    payoutTopCurrencies,
    volumeByCurrency,
  };
}
