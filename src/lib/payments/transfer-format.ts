export function fmtMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount == null) return "—";
  const code = currency?.trim() || "";
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return code ? `${formatted} ${code}` : formatted;
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function labelEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function beneficiaryName(
  beneficiary: { firstName?: string; lastName?: string } | null | undefined,
): string {
  if (!beneficiary) return "—";
  const name = [beneficiary.firstName, beneficiary.lastName].filter(Boolean).join(" ");
  return name || "—";
}

type ReceiveCurrencyRow = {
  receiveCurrency?: string | null;
  beneficiary?: { payoutCurrency?: string | null } | null;
};

export function resolveTransferReceiveCurrency(
  row: ReceiveCurrencyRow,
): string | null {
  const direct = row.receiveCurrency?.trim().toUpperCase();
  if (direct) return direct;
  const fallback = row.beneficiary?.payoutCurrency?.trim().toUpperCase();
  return fallback || null;
}

type PayoutBeneficiary = {
  deliveryChannel?: string;
  accountNumber?: string | null;
  iban?: string | null;
  mobileNumber?: string | null;
  payoutInPersonIdNumber?: string | null;
};

export function payoutDestination(
  beneficiary: PayoutBeneficiary | null | undefined,
): string {
  if (!beneficiary) return "—";
  const channel = beneficiary.deliveryChannel?.toUpperCase();
  if (channel === "MOBILE_MONEY") {
    return beneficiary.mobileNumber?.trim() || "—";
  }
  if (channel === "BANK_TRANSFER" || channel === "UPI") {
    return (
      beneficiary.accountNumber?.trim() ||
      beneficiary.iban?.trim() ||
      "—"
    );
  }
  if (channel === "PAYOUT_IN_PERSON") {
    return beneficiary.payoutInPersonIdNumber?.trim() || "—";
  }
  return (
    beneficiary.accountNumber?.trim() ||
    beneficiary.mobileNumber?.trim() ||
    beneficiary.iban?.trim() ||
    "—"
  );
}

export function payoutBankOrProvider(
  beneficiary: {
    deliveryChannel?: string;
    bankName?: string | null;
    flexBankName?: string | null;
    mobileMoneyProvider?: string | null;
  } | null | undefined,
): string {
  if (!beneficiary) return "—";
  const channel = beneficiary.deliveryChannel?.toUpperCase();
  if (channel === "MOBILE_MONEY") {
    return beneficiary.mobileMoneyProvider?.trim() || "—";
  }
  return (
    beneficiary.bankName?.trim() ||
    beneficiary.flexBankName?.trim() ||
    "—"
  );
}
