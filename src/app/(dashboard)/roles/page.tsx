import { UsersAndRolesClient } from "./UsersAndRolesClient";

export default function UsersAndRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Users &amp; Roles</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create admin accounts and assign country access for regional operations.
        </p>
      </div>
      <UsersAndRolesClient />
    </div>
  );
}
