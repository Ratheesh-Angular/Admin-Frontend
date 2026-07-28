"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { CreateAdminModal } from "@/components/users/CreateAdminModal";
import { AppDialog } from "@/components/ui/AppDialog";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  fetchRegistrationCountries,
  type CountryRow,
} from "@/lib/registration-countries";

type AdminRow = {
  id: string;
  email: string | null;
  username: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  active: boolean;
  createdAt: string;
  countryCodes: string[];
};

type ConfirmAction =
  | {
      kind: "deactivate";
      admin: AdminRow;
    }
  | {
      kind: "delete";
      admin: AdminRow;
    };

function formatRole(role: AdminRow["role"]) {
  return role === "SUPER_ADMIN" ? "Super Admin" : "Admin";
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatCountryAccess(
  admin: AdminRow,
  countryByCode: Map<string, string>,
): string {
  if (admin.role === "SUPER_ADMIN") return "All countries";
  if (!admin.countryCodes.length) return "—";
  return admin.countryCodes
    .map((code) => countryByCode.get(code) ?? code)
    .join(", ");
}

function adminLabel(admin: AdminRow) {
  return admin.username || admin.email || "this admin";
}

export function UsersAndRolesClient() {
  const router = useRouter();
  const { session } = useAdminSession();
  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [countryRows, setCountryRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const countryByCode = useMemo(
    () => new Map(countryRows.map((c) => [c.couCode, c.couName])),
    [countryRows],
  );

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [adminsRes, countries] = await Promise.all([
        fetch("/api/admin/admins", { credentials: "same-origin" }),
        fetchRegistrationCountries().catch(() => [] as CountryRow[]),
      ]);
      const data = await adminsRes.json().catch(() => ({}));
      setCountryRows(countries);

      if (adminsRes.status === 403) {
        setAccessDenied(true);
        setAdmins([]);
        return;
      }

      if (!adminsRes.ok) {
        setMessage({
          kind: "err",
          text: data?.message || data?.error || "Failed to load admin users.",
        });
        setAdmins([]);
        return;
      }

      setAdmins((data?.data?.admins as AdminRow[]) ?? []);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  function requestToggleActive(admin: AdminRow) {
    if (admin.role === "SUPER_ADMIN") return;
    if (admin.active) {
      setConfirmAction({ kind: "deactivate", admin });
      return;
    }
    void toggleActive(admin, true);
  }

  async function toggleActive(admin: AdminRow, nextActive: boolean) {
    setActingId(admin.id);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/admins/${encodeURIComponent(admin.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: nextActive }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.message || data?.error || "Could not update admin status.",
        });
        return;
      }
      setMessage({
        kind: "ok",
        text: nextActive
          ? `${adminLabel(admin)} is now active.`
          : `${adminLabel(admin)} is now inactive.`,
      });
      await loadAdmins();
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setActingId(null);
    }
  }

  async function deleteAdmin(admin: AdminRow) {
    setActingId(admin.id);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/admins/${encodeURIComponent(admin.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.message || data?.error || "Could not delete admin user.",
        });
        return;
      }
      setMessage({
        kind: "ok",
        text: `${adminLabel(admin)} was deleted.`,
      });
      await loadAdmins();
    } catch {
      setMessage({ kind: "err", text: "Network error." });
    } finally {
      setActingId(null);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return;
    const admin = confirmAction.admin;
    setConfirmAction(null);
    if (confirmAction.kind === "deactivate") {
      await toggleActive(admin, false);
      return;
    }
    await deleteAdmin(admin);
  }

  const confirmDialog = confirmAction
    ? confirmAction.kind === "deactivate"
      ? {
          title: "Deactivate admin?",
          message: `${adminLabel(confirmAction.admin)} will not be able to sign in until reactivated.`,
          confirmLabel: "Deactivate",
          destructive: true,
        }
      : {
          title: "Delete admin permanently?",
          message: `${adminLabel(confirmAction.admin)} will be removed from the console. This cannot be undone.`,
          confirmLabel: "Delete",
          destructive: true,
        }
    : null;

  if (accessDenied) {
    return (
      <div className="max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        <p className="font-medium">Access restricted</p>
        <p className="mt-1 text-amber-800">
          Only super admins can manage users and roles.
        </p>
        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="mt-4 text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
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

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Admin users</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage console operators and their country access.
              </p>
            </div>
            {isSuperAdmin ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-10 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add admin
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-slate-500">Loading admin users…</p>
          ) : admins.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No admin users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Username</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Countries</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    {isSuperAdmin ? (
                      <th className="px-6 py-3 font-medium">Actions</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((admin) => {
                    const isTargetSuperAdmin = admin.role === "SUPER_ADMIN";
                    const rowBusy = actingId === admin.id;

                    return (
                      <tr key={admin.id} className="text-slate-700">
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {admin.username || "—"}
                        </td>
                        <td className="px-6 py-3">{admin.email || "—"}</td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isTargetSuperAdmin
                                ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {formatRole(admin.role)}
                          </span>
                        </td>
                        <td className="px-6 py-3 max-w-xs">
                          <span className="text-slate-600 line-clamp-2">
                            {formatCountryAccess(admin, countryByCode)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {isTargetSuperAdmin ? (
                            <span className="text-slate-700">Active</span>
                          ) : isSuperAdmin ? (
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                                checked={admin.active}
                                disabled={rowBusy}
                                onChange={() => requestToggleActive(admin)}
                              />
                              <span className="text-slate-700">
                                {admin.active ? "Active" : "Inactive"}
                              </span>
                            </label>
                          ) : (
                            <span className="text-slate-700">
                              {admin.active ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {formatDate(admin.createdAt)}
                        </td>
                        {isSuperAdmin ? (
                          <td className="px-6 py-3">
                            {isTargetSuperAdmin ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() =>
                                  setConfirmAction({ kind: "delete", admin })
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <CreateAdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={async () => {
          setMessage({
            kind: "ok",
            text: "Admin user created. They can sign in with their email or username.",
          });
          await loadAdmins();
        }}
      />

      {confirmDialog ? (
        <AppDialog
          open
          variant="confirm"
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          destructive={confirmDialog.destructive}
          loading={actingId === confirmAction?.admin.id}
          onClose={() => {
            if (actingId) return;
            setConfirmAction(null);
          }}
          onConfirm={handleConfirmAction}
        />
      ) : null}
    </>
  );
}
