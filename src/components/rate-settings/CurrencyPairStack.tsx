import {
  AdminCurrencyPairFlags,
} from "@/components/country/AdminCurrencyPairFlags";
import { ADMIN_COUNTRY_FLAG_PX } from "@/components/country/AdminCountryFlag";

type CurrencyPairStackProps = {
  baseCountryCode: string;
  quoteCountryCode: string;
  baseCurrency: string;
  quoteCurrency: string;
  /** Smaller flags and text for dense lists (e.g. dropdown options). */
  compact?: boolean;
  /** Load flag images immediately — use inside open dropdowns. */
  eagerFlags?: boolean;
};

export function CurrencyPairStack({
  baseCountryCode,
  quoteCountryCode,
  baseCurrency,
  quoteCurrency,
  compact = false,
  eagerFlags = false,
}: CurrencyPairStackProps) {
  const flagSize = compact ? "sm" : "lg";

  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-3.5"}`}>
      <AdminCurrencyPairFlags
        baseCountryCode={baseCountryCode}
        quoteCountryCode={quoteCountryCode}
        size={flagSize === "sm" ? ADMIN_COUNTRY_FLAG_PX.sm : ADMIN_COUNTRY_FLAG_PX.lg}
        eager={eagerFlags}
      />
      <span
        className={
          compact
            ? "text-sm font-medium text-slate-800"
            : "font-semibold text-slate-900 tracking-tight"
        }
      >
        {baseCurrency} - {quoteCurrency}
      </span>
    </div>
  );
}
