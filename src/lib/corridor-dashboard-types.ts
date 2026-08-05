export type UserCounts = {
  newToday: number;
  approved: number;
  pending: number;
  rejected: number;
};

export type TransactionCounts = {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
};

export type FxTickerItem = {
  pair: string;
  rate: number;
  direction: "up" | "down" | "flat";
};

export type PayInByCurrencyItem = {
  currency: string;
  countryIso2: string | null;
  countryName: string | null;
  localVolume: number;
  usdVolume: number;
  transferCount: number;
};

export type CorridorMatrixCell = {
  payCurrency: string;
  receiveCurrency: string;
  usdVolume: number;
  localPayVolume: number;
};

export type CorridorMatrix = {
  payCurrencies: string[];
  receiveCurrencies: string[];
  cells: CorridorMatrixCell[];
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
};

export type PayoutTopCurrencyItem = {
  currency: string;
  countryIso2: string | null;
  countryName: string | null;
  nativeVolume: number;
  usdVolume: number;
  transferCount: number;
};

export type VolumeByCurrencyItem = {
  currency: string;
  localVolume: number;
  usdVolume: number;
};

export type DashboardStatsPayload = {
  totalTransfers: number;
  transactionCounts?: TransactionCounts;
  userCounts?: UserCounts;
  statsDate?: string;
  totalUsers: number;
  personalUsers: number;
  corporateUsers: number;
  totalTransferValue: number;
  totalTransferValueUsd?: number;
  payCurrency: string | null;
  volumeByCurrency?: VolumeByCurrencyItem[];
  avgKycAuthMinutes: number | null;
  avgKycAuthHours: number | null;
  avgKycAuthDays: number | null;
  kycAuthSampleSize: number;
  fxTicker?: FxTickerItem[];
  payInByCurrency?: PayInByCurrencyItem[];
  corridorMatrix?: CorridorMatrix;
  payoutTopCurrencies?: PayoutTopCurrencyItem[];
};

export type EnrichedDashboardStats = DashboardStatsPayload & {
  transactionCounts: TransactionCounts;
  userCounts: UserCounts;
  fxTicker: FxTickerItem[];
  payInByCurrency: PayInByCurrencyItem[];
  corridorMatrix: CorridorMatrix;
  payoutTopCurrencies: PayoutTopCurrencyItem[];
  volumeByCurrency: VolumeByCurrencyItem[];
};

export type StatusSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};
