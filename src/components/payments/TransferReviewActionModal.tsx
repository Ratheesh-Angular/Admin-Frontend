"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type TransferReviewAction = "ACCEPTED" | "REJECTED" | "REMIND";

type TransferReviewActionModalProps = {
  open: boolean;
  action: TransferReviewAction;
  recipientName: string;
  referenceCode: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
};

export function buildTransferReviewTemplate(
  action: TransferReviewAction,
  recipientName: string,
  referenceCode: string,
): string {
  const name = recipientName.trim() || "there";
  const ref = referenceCode.trim() || "your transfer";
  if (action === "ACCEPTED") {
    return `Hi ${name}, we have received and confirmed your bank transfer payment for transfer ${ref}. Your payout is now being processed and you will be notified once it is completed.`;
  }
  if (action === "REMIND") {
    return `Payment Reminder

We have received your transfer request with Ref: ${ref}.
Please process the payment to our account below so we can complete the payout.`;
  }
  return `Hi ${name},

We are unable to locate your payment in our bank account for transfer ${ref}.

Kindly send your payment proof to accounts@flex-money.com for verification or upload it through your dashboard. Once we receive and verify the payment, we will process your transfer promptly.

Thank you.`;
}

export function TransferReviewActionModal({
  open,
  action,
  recipientName,
  referenceCode,
  loading = false,
  onClose,
  onConfirm,
}: TransferReviewActionModalProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMessage(
        buildTransferReviewTemplate(action, recipientName, referenceCode),
      );
    }
  }, [open, action, recipientName, referenceCode]);

  if (!open) return null;

  const isAccept = action === "ACCEPTED";
  const isRemind = action === "REMIND";
  const title = isAccept
    ? "Accept transfer"
    : isRemind
      ? "Remind Payment"
      : "Reject transfer";
  const description = isAccept
    ? "Review the email message below. The customer will receive this when you accept their bank transfer payment."
    : isRemind
      ? "Review the payment reminder below. Company bank account details will be appended automatically in the email."
      : "Review the email message below. The customer will receive this when you reject their bank transfer payment.";
  const confirmLabel = loading
    ? isAccept
      ? "Accepting…"
      : isRemind
        ? "Sending…"
        : "Rejecting…"
    : isAccept
      ? "Accept transfer"
      : isRemind
        ? "Send reminder"
        : "Reject transfer";
  const trimmedMessage = message.trim();
  const confirmDisabled = loading || (isRemind && !trimmedMessage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-review-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h2
              id="transfer-review-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <label
            htmlFor="transfer-review-message"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Email message to customer
          </label>
          <textarea
            id="transfer-review-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 resize-y min-h-[8rem]"
            placeholder="Enter a message for the customer…"
          />
          <p className="mt-2 text-xs text-slate-500">
            {isRemind
              ? "A message is required to send the payment reminder."
              : "Leave empty to skip sending an email. The transfer action will still be completed."}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmedMessage)}
            disabled={confirmDisabled}
            className={`inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              isAccept
                ? "bg-emerald-600 hover:bg-emerald-700"
                : isRemind
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
