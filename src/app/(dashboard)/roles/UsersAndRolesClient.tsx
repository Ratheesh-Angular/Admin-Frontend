"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { CreateAdminModal } from "@/components/users/CreateAdminModal";
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

export function UsersAndRolesClient() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [countryRows, setCountryRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
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
          text: data?.message || "Failed to load admin users.",
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
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 h-10 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add admin
            </button>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="text-slate-700">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        {admin.username || "—"}
                      </td>
                      <td className="px-6 py-3">{admin.email || "—"}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            admin.role === "SUPER_ADMIN"
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
                        {admin.active ? "Active" : "Inactive"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {formatDate(admin.createdAt)}
                      </td>
                    </tr>
                  ))}
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
    </>
  );
}
