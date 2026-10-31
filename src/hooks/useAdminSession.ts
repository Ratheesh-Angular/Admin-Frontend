"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminScopeClient } from "@/lib/admin-currency-pair-access";
import {
  type AdminPermissionKey,
  type ConsoleAdminRole,
  effectivePermissions,
  hasPermission,
  isConsoleAdminRole,
} from "@/lib/admin-permissions";

export type AdminSession = {
  id: string;
  role: ConsoleAdminRole;
  countryCodes: string[];
  permissions: AdminPermissionKey[];
};

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        setSession(null);
        return;
      }
      const admin = data?.data?.admin;
      if (!admin) {
        setSession(null);
        return;
      }
      const roleRaw = String(admin.role ?? "");
      const role: ConsoleAdminRole = isConsoleAdminRole(roleRaw)
        ? roleRaw
        : "ADMIN";
      const countryCodes = Array.isArray(admin.countryCodes)
        ? admin.countryCodes.map((c: string) => String(c).trim().toUpperCase())
        : [];
      const permissions = effectivePermissions(
        role,
        Array.isArray(admin.permissions) ? admin.permissions : [],
      );
      setSession({
        id: String(admin.id ?? ""),
        role,
        countryCodes,
        permissions,
      });
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scope: AdminScopeClient | null = session
    ? { role: session.role, countryCodes: session.countryCodes }
    : null;

  const can = useCallback(
    (key: AdminPermissionKey) => {
      if (!session) return false;
      return hasPermission(session.role, session.permissions, key);
    },
    [session],
  );

  return { session, scope, loading, reload: load, can };
}
