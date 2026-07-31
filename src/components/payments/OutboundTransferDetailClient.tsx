"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  User,
  Wallet,
} from "lucide-react";
import { DetailRow, SectionCard, TransferStatusBadge } from "./transfer-ui";
import { AppDialog } from "@/components/ui/AppDialog";
import {
  beneficiaryName,
  fmtDate,
  fmtDateTime,
  fmtMoney,
  labelEnum,
} from "@/lib/payments/transfer-format";
import type { OutboundTransferDetail } from "@/lib/payments/outbound-transfer-types";
import { resolveTransferFailureDisplay } from "@/lib/payments/flex-response-codes";

type TabId =
  | "overview"
  | "amounts"
  | "beneficiary"
  | "customer"
  | "compliance"
  | "accept";

type PayoutDebug = {
  label: string | null;
  payload: unknown;
  flexResponse: unknown;
  error: string | null;
};

type OutboundTransferDetailClientProps = {
  transferId: string;
  backHref: string;
  backLabel: string;
};

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "amounts", label: "Amounts", icon: Wallet },
  { id: "beneficiary", label: "Beneficiary", icon: User },
  { id: "customer", label: "Customer", icon: Building2 },
  { id: "compliance", label: "Compliance", icon: FileText },
  { id: "accept", label: "Accept transfer", icon: CheckCircle2 },
];

const ACCEPTABLE_ACCEPT_STATUSES = new Set([
  "PENDING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "UNDER_REVIEW",
]);

function extractPayoutDebug(data: Record<string, unknown>): PayoutDebug {
  const inner =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};
  return {
    label:
      typeof inner.payoutPayloadLabel === "string"
        ? inner.payoutPayloadLabel
        : null,
    payload: inner.payoutPayload ?? null,
    flexResponse: inner.flexResponse ?? null,
    error: typeof data.error === "string" ? data.error : null,
  };
}

export function OutboundTransferDetailClient({
  transferId,
  backHref,
  backLabel,
}: OutboundTransferDetailClientProps) {
  const [transfer, setTransfer] = useState<OutboundTransferDetail | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
  const [payoutDebug, setPayoutDebug] = useState<PayoutDebug | null>(null);
  const [message, setMessage] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/transfers/${encodeURIComponent(transferId)}`,
        { credentials: "same-origin" },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || data?.message || "Failed to load transfer.",
        });
        setTransfer(null);
        return;
      }
      setTransfer((data?.data?.transfer as OutboundTransferDetail) ?? null);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    void load();
  }, [load]);

  const canAccept =
    transfer &&
    transfer.payInMethod === "BANK_TRANSFER" &&
    ACCEPTABLE_ACCEPT_STATUSES.has(transfer.status) &&
    !transfer.payoutInitiatedAt &&
    Boolean(transfer.beneficiary);

  const payoutAlreadyInitiated =
    transfer &&
    transfer.payInMethod === "BANK_TRANSFER" &&
    !canAccept &&
    Boolean(transfer.beneficiary) &&
    (Boolean(transfer.payoutInitiatedAt) ||
      transfer.status === "PROCESSING" ||
      transfer.status === "COMPLETED" ||
      transfer.status === "FAILED");

  async function acceptTransfer() {
    if (!transfer || !canAccept) return;

    setActing(true);
    setMessage(null);
    setPayoutDebug(null);

    try {
      const res = await fetch(
        `/api/admin/transfers/${encodeURIComponent(transferId)}/trigger-payout`,
        { method: "POST", credentials: "same-origin" },
      );
      const data = (await res.json()) as Record<string, unknown>;
      const debug = extractPayoutDebug(data);
      setPayoutDebug(debug);

      if (res.ok && data.success) {
        setMessage({
          kind: "ok",
          text: `Transfer accepted for ${transfer.referenceCode}. Payout has been initiated.`,
        });
        setConfirmAcceptOpen(false);
        await load();
      } else {
        setMessage({
          kind: "err",
          text: String(
            data.error || data.message || "Could not accept transfer.",
          ),
        });
      }
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setActing(false);
    }
  }

  const bankPaymentConfirmed =
    transfer?.payInMethod === "BANK_TRANSFER" &&
    (Boolean(transfer.paymentConfirmedByAdminName) ||
      Boolean(transfer.paymentConfirmedAt) ||
      Boolean(transfer.payoutInitiatedAt));

  const visibleTabs = useMemo(() => {
    if (transfer?.payInMethod === "BANK_TRANSFER") return TABS;
    return TABS.filter((t) => t.id !== "accept");
  }, [transfer?.payInMethod]);

  useEffect(() => {
    if (tab === "accept" && transfer?.payInMethod !== "BANK_TRANSFER") {
      setTab("overview");
    }
  }, [tab, transfer?.payInMethod]);

  return (
    <>
      <div className="max-w-5xl space-y-6">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                Outbound transfer
              </p>
              <h1 className="text-xl font-semibold text-slate-900 mt-1 font-mono">
                {transfer?.referenceCode ?? "Transfer details"}
              </h1>
              {transfer ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TransferStatusBadge status={transfer.status} />
                  <span className="text-sm text-slate-500">
                    {transfer.user.name || transfer.user.email}
                  </span>
                </div>
              ) : null}
            </div>
            {transfer ? (
              <div className="text-right text-sm text-slate-600">
                <p className="font-medium text-slate-900 tabular-nums">
                  {fmtMoney(transfer.payAmount, transfer.payCurrency)}
                </p>
                <p className="text-xs mt-0.5">
                  → {fmtMoney(transfer.receiveAmount, transfer.receiveCurrency)}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.kind === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading transfer details…
          </div>
        ) : !transfer ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Transfer not found.
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200">
              <nav
                className="flex gap-1 overflow-x-auto pb-px"
                aria-label="Transfer sections"
              >
                {visibleTabs.map((t) => {
                  const Icon = t.icon;
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        active
                          ? "border-indigo-600 text-indigo-700"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 opacity-90" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {tab === "overview" && (
              <SectionCard
                title="Transfer overview"
                description="Status and lifecycle"
              >
                <dl>
                  <DetailRow label="Reference" value={transfer.referenceCode} />
                  <DetailRow
                    label="Status"
                    value={<TransferStatusBadge status={transfer.status} />}
                  />
                  <DetailRow
                    label="Current step"
                    value={String(transfer.currentStep)}
                  />
                  <DetailRow
                    label="Corridor"
                    value={`${transfer.senderCountryIso2 ?? "—"} → ${transfer.recipientCountryLabel || transfer.recipientCountryIso2 || "—"}`}
                  />
                  <DetailRow
                    label="Pay-in method"
                    value={labelEnum(transfer.payInMethod)}
                  />
                  {transfer.payInMethod === "MOBILE_MONEY" ? (
                    <>
                      <DetailRow
                        label="Payer phone"
                        value={transfer.payerPhone}
                      />
                      <DetailRow
                        label="STK reference"
                        value={transfer.flexStkReference}
                      />
                      <DetailRow
                        label="STK status"
                        value={transfer.flexStkStatus}
                      />
                    </>
                  ) : null}
                  <DetailRow
                    label="Payout reference"
                    value={transfer.flexPayoutReference}
                  />
                  <DetailRow
                    label="Payout status"
                    value={transfer.flexPayoutStatus}
                  />
                  {transfer.payInMethod === "BANK_TRANSFER" ? (
                    <DetailRow
                      label={
                        bankPaymentConfirmed
                          ? "Payment Confirmed By"
                          : "Payment Confirmation"
                      }
                      value={
                        bankPaymentConfirmed
                          ? transfer.paymentConfirmedByAdminName || "—"
                          : "Pending"
                      }
                    />
                  ) : null}
                  <DetailRow
                    label="Payment confirmed at"
                    value={fmtDateTime(transfer.paymentConfirmedAt)}
                  />
                  <DetailRow
                    label="TXN Created"
                    value={fmtDateTime(transfer.createdAt)}
                  />
                  <DetailRow
                    label="Payout initiated"
                    value={fmtDateTime(transfer.payoutInitiatedAt)}
                  />
                  <DetailRow
                    label="TXN Completed"
                    value={fmtDateTime(transfer.completedAt)}
                  />

                  <DetailRow
                    label="TXN Updated"
                    value={fmtDateTime(transfer.updatedAt)}
                  />
                  {transfer.status === "FAILED" ? (
                    <DetailRow
                      label="Failure reason"
                      value={resolveTransferFailureDisplay(transfer)}
                      wide
                    />
                  ) : null}
                </dl>
              </SectionCard>
            )}

            {tab === "amounts" && (
              <SectionCard
                title="Amounts & quote"
                description="Send, receive, fees, and rate"
              >
                <dl>
                  <DetailRow
                    label="You send"
                    value={fmtMoney(transfer.payAmount, transfer.payCurrency)}
                  />
                  <DetailRow
                    label="Recipient gets"
                    value={fmtMoney(
                      transfer.receiveAmount,
                      transfer.receiveCurrency,
                    )}
                  />
                  <DetailRow
                    label="Fee"
                    value={fmtMoney(transfer.feeAmount, transfer.payCurrency)}
                  />
                  <DetailRow
                    label="FX rate"
                    value={transfer.fxRateSnapshot ?? "—"}
                  />
                  <DetailRow
                    label="Quote expires"
                    value={fmtDateTime(transfer.quoteExpiresAt)}
                  />
                  <DetailRow
                    label="Pay currency"
                    value={transfer.payCurrency}
                  />
                  <DetailRow
                    label="Receive currency"
                    value={transfer.receiveCurrency}
                  />
                </dl>
              </SectionCard>
            )}

            {tab === "beneficiary" && (
              <SectionCard
                title="Beneficiary"
                description="Payout destination details"
              >
                {transfer.beneficiary ? (
                  <dl>
                    <DetailRow
                      label="Name"
                      value={beneficiaryName(transfer.beneficiary)}
                    />
                    <DetailRow
                      label="Delivery channel"
                      value={labelEnum(transfer.beneficiary.deliveryChannel)}
                    />
                    <DetailRow
                      label="Country"
                      value={transfer.beneficiary.country}
                    />
                    <DetailRow
                      label="Bank"
                      value={transfer.beneficiary.bankName}
                    />
                    <DetailRow
                      label="Flex bank"
                      value={transfer.beneficiary.flexBankName}
                    />
                    <DetailRow
                      label="Flex bank code"
                      value={transfer.beneficiary.flexBankCode}
                    />
                    <DetailRow
                      label="Branch"
                      value={transfer.beneficiary.branchName}
                    />
                    <DetailRow
                      label="Account number"
                      value={transfer.beneficiary.accountNumber}
                    />
                    <DetailRow label="IBAN" value={transfer.beneficiary.iban} />
                    <DetailRow
                      label="SWIFT / BIC"
                      value={transfer.beneficiary.swiftBic}
                    />
                    <DetailRow
                      label="Sort code"
                      value={transfer.beneficiary.sortCode}
                    />
                    <DetailRow
                      label="Routing number"
                      value={transfer.beneficiary.routingNumber}
                    />
                    <DetailRow
                      label="Transit number"
                      value={transfer.beneficiary.transitNumber}
                    />
                    <DetailRow label="BSB" value={transfer.beneficiary.bsb} />
                    <DetailRow label="IFSC" value={transfer.beneficiary.ifsc} />
                    <DetailRow
                      label="Payout currency"
                      value={transfer.beneficiary.payoutCurrency}
                    />
                    <DetailRow
                      label="Mobile provider"
                      value={transfer.beneficiary.mobileMoneyProvider}
                    />
                    <DetailRow
                      label="Mobile number"
                      value={transfer.beneficiary.mobileNumber}
                    />
                    <DetailRow
                      label="ID for payout in person"
                      value={transfer.beneficiary.payoutInPersonIdNumber}
                    />
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500 py-4">
                    No beneficiary on file.
                  </p>
                )}
              </SectionCard>
            )}

            {tab === "customer" && (
              <SectionCard
                title="Customer"
                description="Sender account details"
              >
                <dl>
                  <DetailRow label="Name" value={transfer.user.name} />
                  <DetailRow label="Email" value={transfer.user.email} />
                  <DetailRow label="Phone" value={transfer.user.phone} />
                  <DetailRow label="Country" value={transfer.user.country} />
                  <DetailRow
                    label="Account type"
                    value={labelEnum(transfer.user.role)}
                  />
                  <DetailRow
                    label="KYC status"
                    value={transfer.user.kycStatus}
                  />
                  {transfer.user.businessName ? (
                    <DetailRow
                      label="Business name"
                      value={transfer.user.businessName}
                    />
                  ) : null}
                  {transfer.user.registrationNumber ? (
                    <DetailRow
                      label="Registration no."
                      value={transfer.user.registrationNumber}
                    />
                  ) : null}
                </dl>
              </SectionCard>
            )}

            {tab === "compliance" && (
              <div className="space-y-6">
                <SectionCard
                  title="Compliance"
                  description="Purpose and declarations"
                >
                  <dl>
                    <DetailRow
                      label="Source of income"
                      value={transfer.sourceOfIncome}
                    />
                    <DetailRow
                      label="Transfer purpose"
                      value={transfer.transferPurpose}
                    />
                    <DetailRow
                      label="Relationship to recipient"
                      value={transfer.relationshipToRecipient}
                    />
                    <DetailRow
                      label="Compliance accepted"
                      value={transfer.complianceAccepted ? "Yes" : "No"}
                    />
                  </dl>
                </SectionCard>

                <SectionCard
                  title="Payment proofs"
                  description="Documents uploaded for pay-in"
                >
                  {transfer.paymentProofs.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">
                      No payment proofs.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {transfer.paymentProofs.map((file) => (
                        <li
                          key={file.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {fmtDate(file.uploadedAt)}
                            </p>
                          </div>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            View
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard
                  title="Supporting documents"
                  description="Invoices and bills of lading"
                >
                  {transfer.supportingDocuments.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">
                      No supporting documents.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {transfer.supportingDocuments.map((file) => (
                        <li
                          key={file.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {labelEnum(file.docType ?? null)} —{" "}
                              {file.fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {fmtDate(file.uploadedAt)}
                            </p>
                          </div>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            View
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>
            )}

            {tab === "accept" && transfer.payInMethod === "BANK_TRANSFER" && (
              <SectionCard
                title="Accept transfer"
                description="Release the outbound payout to the beneficiary"
              >
                <div className="py-4 space-y-5">
                  <div className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-200 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      <p>
                        Review all tabs before accepting. This action initiates
                        the Flex payout for{" "}
                        <span className="font-medium text-slate-900">
                          {fmtMoney(transfer.payAmount, transfer.payCurrency)}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium text-slate-900">
                          {beneficiaryName(transfer.beneficiary)}
                        </span>
                        .
                      </p>
                      {transfer.status === "COMPLETED" ? (
                        <p className="mt-2 text-emerald-700 font-medium">
                          This transfer is already completed.
                        </p>
                      ) : null}
                      {payoutAlreadyInitiated ? (
                        <p className="mt-2 text-emerald-700 font-medium">
                          Payout has already been initiated for this transfer.
                        </p>
                      ) : null}
                      {!transfer.beneficiary ? (
                        <p className="mt-2 text-red-700 font-medium">
                          Cannot accept — no beneficiary attached.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={acting || !canAccept}
                      onClick={() => setConfirmAcceptOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 h-11 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {acting ? "Processing…" : "Accept transfer"}
                    </button>
                  </div>

                  {payoutDebug?.payload ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-950 text-slate-100 overflow-hidden">
                      <div className="px-4 py-2 border-b border-slate-800 text-xs font-medium text-slate-300">
                        {payoutDebug.label ?? "Payout payload"}
                      </div>
                      <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(payoutDebug.payload, null, 2)}
                      </pre>
                      {payoutDebug.flexResponse ? (
                        <>
                          <div className="px-4 py-2 border-t border-slate-800 text-xs font-medium text-slate-300">
                            Flex response
                          </div>
                          <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap border-t border-slate-800">
                            {JSON.stringify(payoutDebug.flexResponse, null, 2)}
                          </pre>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            )}
          </>
        )}
      </div>

      <AppDialog
        open={confirmAcceptOpen}
        variant="confirm"
        title="Accept transfer?"
        message={
          transfer
            ? `Release payout for ${transfer.referenceCode}? This initiates the outbound transfer to the beneficiary and can only be done once.`
            : undefined
        }
        confirmLabel="Accept transfer"
        loading={acting}
        onClose={() => {
          if (acting) return;
          setConfirmAcceptOpen(false);
        }}
        onConfirm={acceptTransfer}
      />
    </>
  );
}
