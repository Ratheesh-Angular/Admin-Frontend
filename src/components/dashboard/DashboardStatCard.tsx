import type { ReactNode } from "react";

export type DashboardStatVariant =
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "indigo"
  | "slate"
  | "violet";

const variantDot: Record<DashboardStatVariant, string> = {
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  slate: "bg-slate-400",
  violet: "bg-violet-500",
};

const variantIcon: Record<DashboardStatVariant, string> = {
  sky: "text-sky-600 bg-sky-50",
  emerald: "text-emerald-600 bg-emerald-50",
  amber: "text-amber-600 bg-amber-50",
  rose: "text-rose-600 bg-rose-50",
  indigo: "text-indigo-600 bg-indigo-50",
  slate: "text-slate-600 bg-slate-100",
  violet: "text-violet-600 bg-violet-50",
};

function StatSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`rounded bg-slate-100 animate-pulse ${compact ? "mt-1 h-5 w-12" : "mt-2 h-7 w-16"}`}
    />
  );
}

export function DashboardStatCard({
  title,
  value,
  subtext,
  icon,
  variant = "indigo",
  loading = false,
  compact = false,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  variant?: DashboardStatVariant;
  loading?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="group min-w-0 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50/80">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${variantDot[variant]}`}
            aria-hidden
          />
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
        </div>
        {loading ? (
          <StatSkeleton compact />
        ) : (
          <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-900">
            {value}
          </p>
        )}
        {subtext && !loading ? (
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{subtext}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="group min-w-0 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          {loading ? (
            <StatSkeleton />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
              {value}
            </p>
          )}
          {subtext && !loading ? (
            <p className="mt-1 truncate text-xs text-slate-500">{subtext}</p>
          ) : null}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${variantIcon[variant]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardMetricPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

export function DashboardChartsPlaceholder() {
  return (
    <section aria-label="Analytics charts" className="space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Analytics
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {["Trend overview", "Performance breakdown"].map((label) => (
          <div
            key={label}
            className="flex min-h-[220px] flex-col rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-4"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-slate-400">Chart area reserved</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
