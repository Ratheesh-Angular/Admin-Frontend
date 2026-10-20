"use client";

import { TransferStatusBadge } from "./transfer-ui";
import { fmtLogDateTime, labelEnum } from "@/lib/payments/transfer-format";
import type { OutboundTransferLog } from "@/lib/payments/outbound-transfer-types";

const FAIL_EVENTS = new Set([
  "PAYIN_FAILED",
  "PAYOUT_FAILED",
  "ADMIN_REJECTED",
]);

const SUCCESS_EVENTS = new Set([
  "PAYIN_CONFIRMED",
  "PAYOUT_COMPLETED",
  "ADMIN_ACCEPTED",
  "TRANSFER_SUBMITTED",
]);

function actorDisplay(entry: OutboundTransferLog): string {
  if (entry.actorLabel?.trim()) return entry.actorLabel.trim();
  switch (entry.actorType) {
    case "CUSTOMER":
      return "Customer";
    case "ADMIN":
      return "Admin";
    case "PROVIDER":
      return "Provider";
    case "SYSTEM":
      return "System";
    default:
      return labelEnum(entry.actorType);
  }
}

function dotClass(entry: OutboundTransferLog): string {
  if (FAIL_EVENTS.has(entry.eventType) || entry.toStatus === "FAILED") {
    return "bg-red-500 ring-red-100";
  }
  if (entry.toStatus === "CANCELLED") {
    return "bg-slate-400 ring-slate-100";
  }
  if (
    SUCCESS_EVENTS.has(entry.eventType) ||
    entry.toStatus === "COMPLETED"
  ) {
    return "bg-emerald-500 ring-emerald-100";
  }
  if (
    entry.toStatus === "PROCESSING" ||
    entry.eventType === "PAYOUT_INITIATED" ||
    entry.eventType === "PAYIN_INITIATED"
  ) {
    return "bg-sky-500 ring-sky-100";
  }
  if (entry.eventType === "ADMIN_REMINDED") {
    return "bg-amber-500 ring-amber-100";
  }
  return "bg-indigo-500 ring-indigo-100";
}

export function TransferActivityLog({
  logs,
}: {
  logs: OutboundTransferLog[];
}) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-6 text-center">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 py-2">
      {logs.map((entry, index) => {
        const isLast = index === logs.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[9px] top-5 bottom-0 w-px bg-slate-200"
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 mt-1.5 h-[18px] w-[18px] shrink-0 rounded-full ring-4 ${dotClass(entry)}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tabular-nums text-slate-900 tracking-tight">
                {fmtLogDateTime(entry.createdAt)}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {entry.title}
              </p>
              {entry.message ? (
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap break-words">
                  {entry.message}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200/80">
                  {actorDisplay(entry)}
                </span>
                {entry.fromStatus || entry.toStatus ? (
                  <span className="inline-flex items-center gap-1.5">
                    {entry.fromStatus ? (
                      <TransferStatusBadge
                        status={entry.fromStatus}
                        compact
                      />
                    ) : null}
                    {entry.fromStatus && entry.toStatus ? (
                      <span className="text-slate-400" aria-hidden>
                        →
                      </span>
                    ) : null}
                    {entry.toStatus ? (
                      <TransferStatusBadge status={entry.toStatus} compact />
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
