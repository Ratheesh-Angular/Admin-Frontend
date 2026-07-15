import { ManageCountryTabs } from "./ManageCountryTabs";

export default function ManageCountryPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
        Manage Country
      </h1>
      <p className="text-slate-500 mt-1 text-sm">
        Configure which countries are available for customer registration and
        for platform payment features.
      </p>
      <div className="mt-6">
        <ManageCountryTabs />
      </div>
    </div>
  );
}
