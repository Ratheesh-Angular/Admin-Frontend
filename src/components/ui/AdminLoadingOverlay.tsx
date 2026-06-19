"use client";

type AdminLoadingOverlayProps = {
  show: boolean;
  label?: string;
};

export function AdminLoadingOverlay({
  show,
  label = "Please wait…",
}: AdminLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-2xl border border-slate-200/80 bg-white px-10 py-9 shadow-xl shadow-slate-900/10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-700 max-w-xs">{label}</p>
        </div>
      </div>
    </div>
  );
}
