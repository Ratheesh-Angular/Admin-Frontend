import type { ReactNode } from "react";

type RateSettingsPageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function RateSettingsPageShell({
  title,
  description,
  children,
}: RateSettingsPageShellProps) {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          Rate settings
        </p>
        <h1 className="text-xl font-semibold text-slate-900 mt-1">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      {children ?? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-600">
            This page is prepared and ready for implementation.
          </p>
        </div>
      )}
    </div>
  );
}
