"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminScopeClient } from "@/lib/admin-currency-pair-access";

export type AdminSession = {
  role: "SUPER_ADMIN" | "ADMIN";
  countryCodes: string[];
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
      setSession({
        role: admin.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
        countryCodes: Array.isArray(admin.countryCodes)
          ? admin.countryCodes.map((c: string) => String(c).trim().toUpperCase())
          : [],
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

  return { session, scope, loading, reload: load };
}
