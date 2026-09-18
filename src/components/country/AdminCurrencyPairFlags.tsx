import {
  AdminCountryFlag,
  ADMIN_COUNTRY_FLAG_PX,
} from "@/components/country/AdminCountryFlag";
import { flagCouCodeForCurrency } from "@/lib/country-currency";

type AdminCurrencyPairFlagsProps = {
  baseCountryCode: string;
  quoteCountryCode: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  className?: string;
  /** Circle diameter in px. Default `lg` (30px). */
  size?: number;
  eager?: boolean;
};

/**
 * Circular base flag on the left; quote flag to its right, slightly raised.
 * Reuse in tables, selects, and anywhere a currency pair is shown.
 */
export function AdminCurrencyPairFlags({
  baseCountryCode,
  quoteCountryCode,
  baseCurrency = "",
  quoteCurrency = "",
  className = "",
  size = ADMIN_COUNTRY_FLAG_PX.lg,
  eager = false,
}: AdminCurrencyPairFlagsProps) {
  const overlap = Math.round(size * 0.62);
  const containerWidth = size + overlap;
  const containerHeight = Math.round(size * 1.28);
  const baseFlag = flagCouCodeForCurrency(baseCurrency, baseCountryCode);
  const quoteFlag = flagCouCodeForCurrency(quoteCurrency, quoteCountryCode);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
      aria-hidden
    >
      <span className="absolute left-0 bottom-0 z-0">
        <AdminCountryFlag
          couCode={baseFlag}
          size={size}
          variant="white"
          eager={eager}
        />
      </span>
      <span className="absolute z-10" style={{ left: overlap, top: 2 }}>
        <AdminCountryFlag
          couCode={quoteFlag}
          size={size}
          variant="white"
          eager={eager}
        />
      </span>
    </div>
  );
}
