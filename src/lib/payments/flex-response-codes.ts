/** Flex API response codes — see response-codes.md at repo root. */
export const FLEX_RESPONSE_CODE_LABELS: Record<string, string> = {
  "0": "Paid Out / Success",
  "100": "The service request is processed successfully.",
  "-1": "Not Allowed",
  "1002": "Msisdn cannot be found",
  "2001": "Rejected - Remitter / Beneficiary in Ofac List",
  "2002": "Rejected - Remitter / Beneficiary in EU Sanctions List",
  "2003": "Rejected - Remitter / Beneficiary in UN sanctions List",
  "2004":
    "Rejected - Credit Party customer type (Unregistered or Registered Customer) cant be supported by the service .",
  "2005":
    "Rejected - Declined due to limit rule: would exceed the maximum balance.",
  "2006": "Cancelled",
  "2007": "Rejected - The balance is insufficient for the transaction.",
  "2008":
    "Rejected - Declined due to limit rule: greater than the maximum transaction amount.",
  "2009": "Rejected - The ReceiverParty information is invalid.",
  "2010": "Rejected - The CreditParty is in an invalid state.",
  "2011": "Rejected - Request cancelled by user",
  "2012": "Rejected - DS timeout.",
  "3000": "Pending",
  "3001": "Approved",
  "3002": "Approved-Bank",
  "3003": "Auto-Pend",
  "3004": "Auto-Pay/Processing",
  "3005": "Other Error",
};

const GENERIC_FAILURE_TEXT = new Set(
  ["success", "paid out", "pending", ""].map((s) => s.toLowerCase()),
);

const CODE_IN_TEXT_RE =
  /\b(?:code|unknown code)\s*(-?\d+)\b/i;

function isBareFlexCode(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^-?\d+$/.test(trimmed)) return trimmed;
  return null;
}

function extractCodeFromText(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const bare = isBareFlexCode(value);
  if (bare) return bare;
  const match = value.match(CODE_IN_TEXT_RE);
  return match?.[1] ?? null;
}

function matchCodeFromStatusText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const lower = text.trim().toLowerCase();
  for (const [code, label] of Object.entries(FLEX_RESPONSE_CODE_LABELS)) {
    if (label.toLowerCase() === lower) return code;
  }
  if (lower.includes("cancelled by user") || lower.includes("canceled by user")) {
    return "2011";
  }
  if (lower.includes("insufficient")) return "2007";
  if (lower.includes("timeout")) return "2012";
  return null;
}

export function extractFlexErrorCode(input: {
  failureReason?: string | null;
  flexStkStatus?: string | null;
  flexPayoutStatus?: string | null;
}): string | null {
  return (
    extractCodeFromText(input.failureReason) ??
    isBareFlexCode(input.flexPayoutStatus) ??
    isBareFlexCode(input.flexStkStatus) ??
    matchCodeFromStatusText(input.failureReason) ??
    matchCodeFromStatusText(input.flexStkStatus) ??
    matchCodeFromStatusText(input.flexPayoutStatus)
  );
}

function pickMeaningfulStatusText(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const raw of candidates) {
    const text = raw?.trim();
    if (!text) continue;
    if (GENERIC_FAILURE_TEXT.has(text.toLowerCase())) continue;
    return text;
  }
  return null;
}

export function resolveTransferFailureDisplay(transfer: {
  status: string;
  failureReason?: string | null;
  flexStkStatus?: string | null;
  flexPayoutStatus?: string | null;
}): string {
  if (transfer.status !== "FAILED") return "—";

  const code = extractFlexErrorCode(transfer);
  if (code) {
    const label = FLEX_RESPONSE_CODE_LABELS[code];
    if (label) return `${label} (code ${code})`;
    return `Flex error (code ${code})`;
  }

  const meaningful = pickMeaningfulStatusText(
    transfer.failureReason,
    transfer.flexStkStatus,
    transfer.flexPayoutStatus,
  );
  if (meaningful) return meaningful;

  return transfer.failureReason?.trim() || "—";
}
