"use client";

import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  X,
} from "lucide-react";

export type AppDialogVariant = "success" | "error" | "info" | "confirm";

export type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  variant: AppDialogVariant;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
};

const icons: Record<
  AppDialogVariant,
  { Icon: typeof Info; wrap: string }
> = {
  success: {
    Icon: CheckCircle2,
    wrap: "bg-emerald-50 text-emerald-600",
  },
  error: {
    Icon: AlertTriangle,
    wrap: "bg-red-50 text-red-600",
  },
  info: {
    Icon: Info,
    wrap: "bg-sky-50 text-sky-600",
  },
  confirm: {
    Icon: HelpCircle,
    wrap: "bg-amber-50 text-amber-600",
  },
};

export function AppDialog({
  open,
  onClose,
  variant,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  loading = false,
}: AppDialogProps) {
  if (!open) return null;

  const { Icon, wrap } = icons[variant];
  const isConfirm = variant === "confirm";
  const primaryLabel = confirmLabel ?? (isConfirm ? "Confirm" : "OK");

  async function handlePrimary() {
    if (isConfirm && onConfirm) {
      await onConfirm();
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Close dialog backdrop"
        onClick={loading ? undefined : onClose}
        disabled={loading}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/15"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby={message ? "app-dialog-desc" : undefined}
      >
        <div className="p-6 pb-4">
          <div className="flex gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${wrap}`}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="app-dialog-title"
                className="pr-8 text-base font-semibold text-slate-900"
              >
                {title}
              </h2>
              {message ? (
                <p
                  id="app-dialog-desc"
                  className="mt-2 text-sm leading-relaxed text-slate-600"
                >
                  {message}
                </p>
              ) : null}
            </div>
            {!isConfirm ? (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:justify-end">
          {isConfirm ? (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handlePrimary()}
            disabled={loading}
            className={`inline-flex h-10 min-w-[7rem] items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Please wait…
              </>
            ) : (
              primaryLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
