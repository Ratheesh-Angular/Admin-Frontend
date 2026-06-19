import Link from "next/link";
import { Globe, Zap } from "lucide-react";

export default function AdminDashboardClient() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">
          Remit2Globe admin console overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickCard
          title="Manage country"
          description="Configure corridor country allowlist"
          href="/manage-country"
          icon={<Globe className="w-6 h-6" />}
        />
        <QuickCard
          title="Test payouts"
          description="Trigger payouts for testing"
          href="/test-payouts"
          icon={<Zap className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}

function QuickCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-xl p-5 transition-all hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="flex items-start">
        <div className="w-8 h-8 mr-1 text-indigo-500 pt-1">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
