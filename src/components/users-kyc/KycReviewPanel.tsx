"use client";

import { useState } from "react";
import { Check, ClipboardCheck, Clock, X } from "lucide-react";
import {
  KycReviewActionModal,
  type KycReviewAction,
} from "./KycReviewActionModal";
import { KycBadge, SectionCard, fmtDate } from "./kyc-ui";

export type KycHistoryEntry = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string;
  adminEmail: string | null;
  message: string | null;
  createdAt: string;
};

type KycReviewPanelProps = {
  kycStatus: string;
  recipientName: string;
  kycHistory?: KycHistoryEntry[];
  acting: "APPROVED" | "REJECTED" | null;
  onApprove: (message: string) => void;
  onReject: (message: string) => void;
};

function reviewGuidance(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "This application was submitted by the customer. Review the other tabs, then approve or reject.";
    case "IN_PROGRESS":
      return "The customer is completing Signzy identity verification. You can still approve or reject for exceptions.";
    case "PENDING":
      return "The customer has not submitted their application yet. You can still approve or reject after reviewing their profile and documents in the other tabs.";
    case "APPROVED":
      return "This KYC is currently approved. You can reject it if you need to revoke access after further review.";
    case "REJECTED":
      return "This KYC was rejected. You can approve it after the customer updates their details or if the rejection was made in error.";
    case "SUSPENDED":
      return "This account KYC is suspended. Approve or reject after reviewing the profile and documents.";
    default:
      return "Review the customer's profile and documents, then set their KYC status.";
  }
}

function KycActivityLog({ history }: { history: KycHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-slate-500">No activity recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
        >
          <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">{entry.action}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {fmtDate(entry.createdAt)}
              {entry.adminEmail ? ` · by ${entry.adminEmail}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function KycReviewPanel({
  kycStatus,
  recipientName,
  kycHistory = [],
  acting,
  onApprove,
  onReject,
}: KycReviewPanelProps) {
  const isApproved = kycStatus === "APPROVED";
  const isRejected = kycStatus === "REJECTED";
  const [pendingAction, setPendingAction] = useState<KycReviewAction | null>(
    null,
  );

  return (
    <SectionCard
      title="KYC review"
      description="Approve or reject this customer's identity verification"
    >
      <div className="py-3 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current status
              </p>
              <div className="mt-1">
                <KycBadge status={kycStatus} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={acting !== null || isRejected}
              onClick={() => setPendingAction("REJECTED")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 h-10 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              {acting === "REJECTED" ? "Rejecting…" : "Reject KYC"}
            </button>
            <button
              type="button"
              disabled={acting !== null || isApproved}
              onClick={() => setPendingAction("APPROVED")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {acting === "APPROVED" ? "Approving…" : "Approve KYC"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Admin activity
          </p>
          <KycActivityLog history={kycHistory} />
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {reviewGuidance(kycStatus)}
        </p>

        <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
          Approving notifies the customer and unlocks transfers. Rejecting asks
          them to review requirements and resubmit from their dashboard.
        </p>
      </div>

      {pendingAction ? (
        <KycReviewActionModal
          open
          action={pendingAction}
          recipientName={recipientName}
          loading={acting !== null}
          onClose={() => {
            if (acting !== null) return;
            setPendingAction(null);
          }}
          onConfirm={(message) => {
            if (acting !== null || !pendingAction) return;
            const action = pendingAction;
            setPendingAction(null);
            if (action === "APPROVED") onApprove(message);
            else onReject(message);
          }}
        />
      ) : null}
    </SectionCard>
  );
}
