"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import R2GLogo from "../../../assets/logos/R2GLogo.png";
import {
  LayoutDashboard,
  Send,
  Settings,
  Wallet,
  FileText,
  User,
  Building2,
  Shield,
  KeyRound,
  LogOut,
} from "lucide-react";

const navItems: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Send Transfer", href: "/send-transfer", icon: Send },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Personal Users", href: "/personal-users", icon: User },
  { label: "Corporate Users", href: "/corporate-users", icon: Building2 },
  { label: "Roles", href: "/roles", icon: Shield },
  { label: "Password", href: "/password", icon: KeyRound },
];

export default function AdminDashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminLabel, setAdminLabel] = useState("Administrator");
  const pathname = usePathname();
  const router = useRouter();

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
          setAdminLabel(label.trim());
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
    router.replace("/login");
    router.refresh();
  }

  const avatarInitial =
    adminLabel[0]?.toUpperCase() || "A";

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
            <Image
              src={R2GLogo}
              alt="Remit2Globe"
              priority
              className="object-contain w-[125px]"
            />
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              Admin Console
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <span className="text-base shrink-0">
                  <item.icon className="w-5 h-5" />
                </span>
                {item.label}
              </Link>
            );
          })}
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
                  {adminLabel}
                </p>
                <p className="text-xs text-slate-500 truncate">Admin</p>
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
