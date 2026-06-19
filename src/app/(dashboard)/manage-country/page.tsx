import { ManageCountryClient } from "./ManageCountryClient";

export default function ManageCountryPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
        Manage country
      </h1>
      <p className="text-slate-500 mt-1 text-sm">
        Choose which Flex corridor countries appear in customer country selectors.
        If none are selected, all countries from Flex are shown.
      </p>
      <div className="mt-6">
        <ManageCountryClient />
      </div>
    </div>
  );
}
