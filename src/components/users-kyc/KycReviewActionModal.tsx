"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type KycReviewAction = "APPROVED" | "REJECTED";

type KycReviewActionModalProps = {
  open: boolean;
  action: KycReviewAction;
  recipientName: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
};

export function buildKycReviewTemplate(
  action: KycReviewAction,
  recipientName: string,
): string {
  const name = recipientName.trim() || "there";
  if (action === "APPROVED") {
    return `Hi ${name}, we are happy to inform you that your KYC application has been approved. You can now add beneficiaries and start sending money from your dashboard.`;
  }
  return `Hi ${name}, unfortunately your KYC application could not be approved at this time. Please review the mandatory documents listed in your dashboard and resubmit any missing or incorrect items.`;
}

export function KycReviewActionModal({
  open,
  action,
  recipientName,
  loading = false,
  onClose,
  onConfirm,
}: KycReviewActionModalProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMessage(buildKycReviewTemplate(action, recipientName));
    }
  }, [open, action, recipientName]);

  if (!open) return null;

  const isApprove = action === "APPROVED";
  const title = isApprove ? "Approve KYC" : "Reject KYC";
  const description = isApprove
    ? "Review the email message below. The customer will receive this when you approve their KYC."
    : "Review the email message below. The customer will receive this when you reject their KYC.";
  const confirmLabel = loading
    ? isApprove
      ? "Approving…"
      : "Rejecting…"
    : isApprove
      ? "Approve KYC"
      : "Reject KYC";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-review-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h2
              id="kyc-review-modal-title"
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
            htmlFor="kyc-review-message"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Email message to customer
          </label>
          <textarea
            id="kyc-review-message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 resize-y min-h-[8rem]"
            placeholder="Enter a message for the customer…"
          />
          <p className="mt-2 text-xs text-slate-500">
            Leave empty to skip sending an email. The KYC status will still be
            updated.
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
            onClick={() => onConfirm(message.trim())}
            disabled={loading}
            className={`inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
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
