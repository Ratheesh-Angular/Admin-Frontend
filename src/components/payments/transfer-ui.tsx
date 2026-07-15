import type { ReactNode } from "react";
import { labelEnum } from "@/lib/payments/transfer-format";

const STATUS_STYLES: Record<
  string,
  { badge: string; dot: string }
> = {
  COMPLETED: {
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
    dot: "bg-emerald-500",
  },
  FAILED: {
    badge: "bg-red-50 text-red-800 ring-red-600/25",
    dot: "bg-red-500",
  },
  CANCELLED: {
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
  PROCESSING: {
    badge: "bg-sky-50 text-sky-800 ring-sky-600/25",
    dot: "bg-sky-500",
  },
  UNDER_REVIEW: {
    badge: "bg-amber-50 text-amber-900 ring-amber-600/25",
    dot: "bg-amber-500",
  },
  PAYMENT_SUBMITTED: {
    badge: "bg-violet-50 text-violet-800 ring-violet-600/25",
    dot: "bg-violet-500",
  },
  PENDING_PAYMENT: {
    badge: "bg-orange-50 text-orange-900 ring-orange-600/25",
    dot: "bg-orange-500",
  },
  DRAFT: {
    badge: "bg-slate-50 text-slate-500 ring-slate-400/20",
    dot: "bg-slate-300",
  },
};

function pipelineStyle(raw: string | null | undefined): {
  badge: string;
  dot: string;
} {
  if (!raw?.trim()) {
    return {
      badge: "bg-slate-50 text-slate-500 ring-slate-400/20",
      dot: "bg-slate-300",
    };
  }
  const s = raw.toLowerCase();
  if (
    s.includes("success") ||
    s.includes("complete") ||
    s.includes("paid") ||
    s === "ok"
  ) {
    return {
      badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
      dot: "bg-emerald-500",
    };
  }
  if (s.includes("fail") || s.includes("error") || s.includes("reject")) {
    return {
      badge: "bg-red-50 text-red-800 ring-red-600/25",
      dot: "bg-red-500",
    };
  }
  if (s.includes("pending") || s.includes("wait") || s.includes("init")) {
    return {
      badge: "bg-amber-50 text-amber-900 ring-amber-600/25",
      dot: "bg-amber-500",
    };
  }
  return {
    badge: "bg-sky-50 text-sky-800 ring-sky-600/25",
    dot: "bg-sky-500",
  };
}

const STATUS_SHORT: Record<string, string> = {
  PENDING_PAYMENT: "Pending",
  PAYMENT_SUBMITTED: "Submitted",
  UNDER_REVIEW: "In review",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
};

export function TransferStatusBadge({
  status,
  compact = false,
}: {
  status: string;
  compact?: boolean;
}) {
  const styles =
    STATUS_STYLES[status] ?? {
      badge: "bg-slate-100 text-slate-700 ring-slate-500/20",
      dot: "bg-slate-400",
    };

  const label = compact
    ? (STATUS_SHORT[status] ?? labelEnum(status))
    : labelEnum(status);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${styles.badge} ${compact ? "shrink-0" : "px-2.5 py-1 text-xs"}`}
      title={labelEnum(status)}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

export function PipelineStatusBadge({ value }: { value: string | null | undefined }) {
  if (!value?.trim()) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const styles = pipelineStyle(value);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${styles.badge}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      {value}
    </span>
  );
}

export function DetailRow({
  label,
  value,
  wide,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`grid gap-1 py-3 border-b border-slate-100 last:border-0 ${
        wide ? "sm:grid-cols-1" : "sm:grid-cols-[minmax(10rem,14rem)_1fr]"
      }`}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900 break-words">{value ?? "—"}</dd>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        ) : null}
      </div>
      <div className="px-5 py-1">{children}</div>
    </section>
  );
}
