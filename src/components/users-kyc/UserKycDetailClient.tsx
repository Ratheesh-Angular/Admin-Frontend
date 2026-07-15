"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  AdminKycProfileView,
  type AdminKycUser,
} from "./AdminKycProfileView";
import { KycBadge } from "./kyc-ui";

type UserKycDetailClientProps = {
  userId: string;
  backHref: string;
  backLabel: string;
  pageTitle: string;
};

export function UserKycDetailClient({
  userId,
  backHref,
  backLabel,
  pageTitle,
}: UserKycDetailClientProps) {
  const [user, setUser] = useState<AdminKycUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || data?.message || "Failed to load user.",
        });
        setUser(null);
        return;
      }
      setUser((data?.data?.user as AdminKycUser) ?? null);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(status: "APPROVED" | "REJECTED", message: string) {
    const label = status === "APPROVED" ? "approve" : "reject";

    setActing(status);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/kyc-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ status, message }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || data?.message || `Could not ${label} KYC.`,
        });
        return;
      }
      setMessage({
        kind: "ok",
        text: status === "APPROVED" ? "KYC approved." : "KYC rejected.",
      });
      await load();
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setActing(null);
    }
  }

  const kycStatus = String(user?.kycStatus ?? "");
  const recipientName =
    String(user?.name ?? "").trim() ||
    String(user?.email ?? "").trim() ||
    "Customer";
  const kycHistory =
    (user?.kycHistory as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            Users KYC
          </p>
          <h1 className="text-xl font-semibold text-slate-900 mt-1">{pageTitle}</h1>
          {user ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{String(user.email ?? user.phone ?? user.id)}</span>
              <KycBadge status={kycStatus} />
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
          Loading user details…
        </div>
      ) : user ? (
        <AdminKycProfileView
          user={user}
          userId={userId}
          acting={acting}
          onApprove={(message) => void review("APPROVED", message)}
          onReject={(message) => void review("REJECTED", message)}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          User not found.
        </div>
      )}
    </div>
  );
}
