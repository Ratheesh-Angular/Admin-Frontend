"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FlexLogo } from "@/components/brand/FlexLogo";
import {
  LayoutDashboard,
  Shield,
  LogOut,
  Globe,
  Percent,
  UserCheck,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  type AdminPermissionKey,
  ROLE_LABELS,
  permissionForPath,
} from "@/lib/admin-permissions";

const HIDDEN_RATE_SETTINGS_HREFS = new Set([
  "/rate-settings/partners-rate-engine",
]);

const HIDDEN_USERS_KYC_HREFS = new Set(["/remittance-partners"]);

const usersKycNav = {
  label: "Users KYC",
  icon: UserCheck,
  items: [
    {
      label: "Personal Users",
      href: "/personal-users",
      permission: "personal_users" as AdminPermissionKey,
    },
    {
      label: "Corporate Users",
      href: "/corporate-users",
      permission: "corporate_users" as AdminPermissionKey,
    },
    {
      label: "Remittance Partners",
      href: "/remittance-partners",
      permission: "personal_users" as AdminPermissionKey,
    },
  ],
};

const rateSettingsNav = {
  label: "Rate settings",
  icon: Percent,
  basePath: "/rate-settings",
  items: [
    {
      label: "Currency Pair",
      href: "/rate-settings/currency-pair",
      permission: "currency_pair" as AdminPermissionKey,
    },
    {
      label: "Exchange rates",
      href: "/rate-settings/exchange-rates",
      permission: "exchange_rates" as AdminPermissionKey,
    },
    {
      label: "Partners Rate Engine",
      href: "/rate-settings/partners-rate-engine",
      permission: "exchange_rates" as AdminPermissionKey,
    },
    {
      label: "Tariffs",
      href: "/rate-settings/tariffs",
      permission: "tariffs" as AdminPermissionKey,
    },
  ],
};

const paymentsNav = {
  label: "Remittance",
  icon: CreditCard,
  basePath: "/payments",
  items: [
    {
      label: "Outbound List (Individuals)",
      href: "/payments/outbound/individuals",
      permission: "remittance_individuals" as AdminPermissionKey,
    },
    {
      label: "Outbound List (Corporates)",
      href: "/payments/outbound/corporates",
      permission: "remittance_corporates" as AdminPermissionKey,
    },
  ],
};

const paymentSettingsNav = {
  label: "Payment settings",
  icon: Wallet,
  items: [
    {
      label: "Source Currency",
      href: "/source-currency",
      permission: "source_currency" as AdminPermissionKey,
    },
    {
      label: "Recipient Currency",
      href: "/recipient-currency",
      permission: "recipient_currency" as AdminPermissionKey,
    },
    {
      label: "Pay-in Methods",
      href: "/pay-in-methods",
      permission: "pay_in_methods" as AdminPermissionKey,
    },
    {
      label: "Card Fees",
      href: "/card-fees",
      permission: "card_fees" as AdminPermissionKey,
    },
  ],
};

function navLinkClass(active: boolean) {
  return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

function submenuButtonClass(active: boolean) {
  return `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

function submenuLinkClass(active: boolean) {
  return `block px-3 py-2 rounded-lg text-sm transition-colors ${
    active
      ? "bg-indigo-50 text-indigo-700 font-medium"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

export default function AdminDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usersKycOpen, setUsersKycOpen] = useState(false);
  const [rateSettingsOpen, setRateSettingsOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading: sessionLoading, can } = useAdminSession();

  const [displayLabel, setDisplayLabel] = useState("Administrator");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        const label =
          data?.data?.admin?.email ||
          data?.data?.admin?.username ||
          data?.data?.admin?.name;
        if (!cancelled && typeof label === "string" && label.trim()) {
          setDisplayLabel(label.trim());
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usersKycItems = useMemo(
    () =>
      usersKycNav.items.filter(
        (sub) =>
          !HIDDEN_USERS_KYC_HREFS.has(sub.href) && can(sub.permission),
      ),
    [can],
  );

  const remittanceItems = useMemo(
    () => paymentsNav.items.filter((sub) => can(sub.permission)),
    [can],
  );

  const rateItems = useMemo(
    () =>
      rateSettingsNav.items.filter(
        (sub) =>
          !HIDDEN_RATE_SETTINGS_HREFS.has(sub.href) && can(sub.permission),
      ),
    [can],
  );

  const paymentSettingsItems = useMemo(
    () => paymentSettingsNav.items.filter((sub) => can(sub.permission)),
    [can],
  );

  const showDashboard = can("dashboard");
  const showManageCountry = can("manage_country");
  const showUsersRoles = can("users_roles");

  const isUsersKycActive =
    pathname.startsWith("/personal-users") ||
    pathname.startsWith("/corporate-users");
  const isRateSettingsActive = pathname.startsWith(rateSettingsNav.basePath);
  const isPaymentsActive = pathname.startsWith(paymentsNav.basePath);
  const isPaymentSettingsActive = paymentSettingsNav.items.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  useEffect(() => {
    if (isUsersKycActive) setUsersKycOpen(true);
  }, [isUsersKycActive]);

  useEffect(() => {
    if (isRateSettingsActive) setRateSettingsOpen(true);
  }, [isRateSettingsActive]);

  useEffect(() => {
    if (isPaymentsActive) setPaymentsOpen(true);
  }, [isPaymentsActive]);

  useEffect(() => {
    if (isPaymentSettingsActive) setPaymentSettingsOpen(true);
  }, [isPaymentSettingsActive]);

  // Soft client-side gate: redirect if current path requires a missing permission
  useEffect(() => {
    if (sessionLoading || !session) return;
    const required = permissionForPath(pathname);
    if (!required) return;
    if (!can(required)) {
      const fallback = can("dashboard") ? "/dashboard" : "/login";
      router.replace(fallback);
    }
  }, [sessionLoading, session, pathname, can, router]);

  async function handleSignOut() {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
    router.replace("/login");
    router.refresh();
  }

  const isDashboardActive =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isManageCountryActive =
    pathname === "/manage-country" || pathname.startsWith("/manage-country/");
  const isRolesActive = pathname === "/roles" || pathname.startsWith("/roles/");

  const roleLabel = session ? ROLE_LABELS[session.role] : "Admin";
  const avatarInitial = displayLabel[0]?.toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}
      >
        <div className="border-b border-slate-200">
          <div className="flex flex-col items-center mb-4 mt-4 gap-2">
            <FlexLogo className="h-8 max-w-[7.5rem]" priority />
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              Admin Console
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {showDashboard ? (
            <Link
              href="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass(isDashboardActive)}
            >
              <span className="text-base shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              Dashboard
            </Link>
          ) : null}

          {usersKycItems.length > 0 ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUsersKycOpen((open) => !open)}
                className={submenuButtonClass(isUsersKycActive)}
              >
                <span className="text-base shrink-0">
                  <usersKycNav.icon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">{usersKycNav.label}</span>
                {usersKycOpen ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                )}
              </button>

              {usersKycOpen ? (
                <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                  {usersKycItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      pathname.startsWith(`${sub.href}/`);

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className={submenuLinkClass(isSubActive)}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {remittanceItems.length > 0 ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPaymentsOpen((open) => !open)}
                className={submenuButtonClass(isPaymentsActive)}
              >
                <span className="text-base shrink-0">
                  <paymentsNav.icon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">{paymentsNav.label}</span>
                {paymentsOpen ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                )}
              </button>

              {paymentsOpen ? (
                <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                  {remittanceItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      pathname.startsWith(`${sub.href}/`);

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className={submenuLinkClass(isSubActive)}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {rateItems.length > 0 ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setRateSettingsOpen((open) => !open)}
                className={submenuButtonClass(isRateSettingsActive)}
              >
                <span className="text-base shrink-0">
                  <rateSettingsNav.icon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">{rateSettingsNav.label}</span>
                {rateSettingsOpen ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                )}
              </button>

              {rateSettingsOpen ? (
                <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                  {rateItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      pathname.startsWith(`${sub.href}/`);

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className={submenuLinkClass(isSubActive)}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {showManageCountry ? (
            <Link
              href="/manage-country"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass(isManageCountryActive)}
            >
              <span className="text-base shrink-0">
                <Globe className="w-5 h-5" />
              </span>
              Manage Country
            </Link>
          ) : null}

          {paymentSettingsItems.length > 0 ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPaymentSettingsOpen((open) => !open)}
                className={submenuButtonClass(isPaymentSettingsActive)}
              >
                <span className="text-base shrink-0">
                  <paymentSettingsNav.icon className="w-5 h-5" />
                </span>
                <span className="flex-1 text-left">
                  {paymentSettingsNav.label}
                </span>
                {paymentSettingsOpen ? (
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                )}
              </button>

              {paymentSettingsOpen ? (
                <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                  {paymentSettingsItems.map((sub) => {
                    const isSubActive =
                      pathname === sub.href ||
                      pathname.startsWith(`${sub.href}/`);

                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className={submenuLinkClass(isSubActive)}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {showUsersRoles ? (
            <Link
              href="/roles"
              onClick={() => setSidebarOpen(false)}
              className={navLinkClass(isRolesActive)}
            >
              <span className="text-base shrink-0">
                <Shield className="w-5 h-5" />
              </span>
              Users &amp; Roles
            </Link>
          ) : null}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-6 bg-white border-b border-slate-200"
          style={{ height: "93px" }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 p-1 -ml-1 rounded-md hover:bg-slate-100"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="hidden lg:block flex-1 min-w-0" aria-hidden />

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 ml-auto">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 px-1">
              <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-medium">
                {avatarInitial}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-medium text-slate-900 truncate max-w-[12rem] md:max-w-[16rem]">
                  {displayLabel}
                </p>
                <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer flex items-center gap-2 px-2.5 sm:px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
