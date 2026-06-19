import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform configuration and operational tools
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/manage-country"
          className="block p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            Manage country
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Flex corridor country allowlist for customer selectors
          </p>
        </Link>
      </div>
    </div>
  );
}
