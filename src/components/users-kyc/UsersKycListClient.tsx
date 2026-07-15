"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminDataTable } from "@/components/ui/AdminDataTable";
import { KycBadge, fmtDate } from "./kyc-ui";

export type UserListRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
};

type UsersKycListClientProps = {
  role: "INDIVIDUAL" | "CORPORATE";
  title: string;
  description: string;
  detailBasePath: string;
};

export function UsersKycListClient({
  role,
  title,
  description,
  detailBasePath,
}: UsersKycListClientProps) {
  const [users, setUsers] = useState<UserListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/users?role=${encodeURIComponent(role)}`,
        { credentials: "same-origin" },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({
          kind: "err",
          text: data?.error || data?.message || "Failed to load users.",
        });
        setUsers([]);
        return;
      }
      setUsers((data?.data?.users as UserListRow[]) ?? []);
    } catch {
      setMessage({ kind: "err", text: "Network error." });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Name",
        searchText: (row: UserListRow) =>
          `${row.name ?? ""} ${row.email ?? ""} ${row.phone ?? ""}`,
        cell: (row: UserListRow) => (
          <span className="font-medium text-slate-900">
            {row.name || row.email || "—"}
          </span>
        ),
      },
      {
        id: "email",
        header: "Email",
        searchText: (row: UserListRow) => row.email ?? "",
        cell: (row: UserListRow) => row.email || "—",
      },
      {
        id: "phone",
        header: "Phone",
        searchText: (row: UserListRow) => row.phone ?? "",
        cell: (row: UserListRow) => row.phone || "—",
      },
      {
        id: "country",
        header: "Country",
        searchText: (row: UserListRow) => row.country ?? "",
        cell: (row: UserListRow) => row.country || "—",
      },
      {
        id: "kycStatus",
        header: "KYC status",
        searchText: (row: UserListRow) => row.kycStatus,
        cell: (row: UserListRow) => <KycBadge status={row.kycStatus} />,
      },
      {
        id: "updated",
        header: "Last updated",
        searchText: (row: UserListRow) => row.updatedAt,
        cell: (row: UserListRow) => fmtDate(row.updatedAt),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right w-20",
        cellClassName: "text-right",
        cell: (row: UserListRow) => (
          <Link
            href={`${detailBasePath}/${row.id}`}
            className="inline-flex p-2 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50"
            aria-label={`View ${row.name ?? row.email ?? "user"}`}
          >
            <Eye className="w-4 h-4" />
          </Link>
        ),
      },
    ],
    [detailBasePath],
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          Users KYC
        </p>
        <h1 className="text-xl font-semibold text-slate-900 mt-1">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
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

      <AdminDataTable
        columns={columns}
        data={users}
        getRowKey={(row) => row.id}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users…"
        loading={loading}
        emptyMessage="No users found."
        filteredEmptyMessage="No users match your search."
      />
    </div>
  );
}
