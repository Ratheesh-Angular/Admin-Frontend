"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { AdminMultiCountrySelect } from "@/components/country/AdminMultiCountrySelect";
import {
  adminButtonPrimary,
  fieldControlBase,
  fieldControlError,
} from "@/lib/field-styles";
import {
  validateAdminEmailDomain,
  validateAdminIdentifier,
  validateAdminPassword,
  validateConfirmPassword,
} from "@/lib/auth-validation";
import { useRegistrationCountries } from "@/hooks/useRegistrationCountries";
import {
  type AdminPermissionKey,
  type ConsoleAdminRole,
  ADMIN_PERMISSION_GROUPS,
  ADMIN_PERMISSION_LABELS,
  DEFAULT_PERMISSIONS_BY_ROLE,
  ROLE_LABELS,
  canActorCreateRole,
  isStaffRole,
} from "@/lib/admin-permissions";
import type { AdminSession } from "@/hooks/useAdminSession";

export type CreateAdminMode =
  | "super_admin"
  | "admin"
  | "support"
  | "compliance"
  | "treasury"
  | "staff";

type EditableAdmin = {
  id: string;
  username: string | null;
  email: string | null;
  role: ConsoleAdminRole;
  countryCodes: string[];
  permissions: AdminPermissionKey[];
};

type CreateAdminModalProps = {
  open: boolean;
  /** Create flow: initial role mode. Ignored when `editAdmin` is set. */
  mode?: CreateAdminMode;
  editAdmin?: EditableAdmin | null;
  actor: AdminSession;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

function modeToRole(mode: CreateAdminMode): ConsoleAdminRole {
  switch (mode) {
    case "super_admin":
      return "SUPER_ADMIN";
    case "admin":
      return "ADMIN";
    case "support":
      return "SUPPORT";
    case "compliance":
      return "COMPLIANCE";
    case "treasury":
      return "TREASURY";
    default:
      return "SUPPORT";
  }
}

function creatableRoles(actorRole: ConsoleAdminRole): ConsoleAdminRole[] {
  const all: ConsoleAdminRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT",
    "COMPLIANCE",
    "TREASURY",
  ];
  return all.filter((r) => canActorCreateRole(actorRole, r));
}

export function CreateAdminModal({
  open,
  mode = "admin",
  editAdmin = null,
  actor,
  onClose,
  onSaved,
}: CreateAdminModalProps) {
  const isEdit = Boolean(editAdmin);
  const initialRole = editAdmin?.role ?? modeToRole(mode);

  const [role, setRole] = useState<ConsoleAdminRole>(initialRole);
  const needsCountries = role !== "SUPER_ADMIN";

  const { countries: allCountries, loading: countriesLoading } =
    useRegistrationCountries(open && needsCountries);

  const countries = useMemo(() => {
    if (actor.role === "SUPER_ADMIN") return allCountries;
    const allowed = new Set(actor.countryCodes.map((c) => c.toUpperCase()));
    return allCountries.filter((c) => allowed.has(c.couCode));
  }, [actor.role, actor.countryCodes, allCountries]);

  const grantable = useMemo(() => {
    if (actor.role === "SUPER_ADMIN") {
      return new Set(Object.keys(ADMIN_PERMISSION_LABELS) as AdminPermissionKey[]);
    }
    return new Set(actor.permissions);
  }, [actor]);

  const roleOptions = useMemo(() => {
    if (isEdit) return [editAdmin!.role];
    if (mode === "super_admin") return ["SUPER_ADMIN"] as ConsoleAdminRole[];
    if (mode === "admin") return ["ADMIN"] as ConsoleAdminRole[];
    if (mode === "support") return ["SUPPORT"] as ConsoleAdminRole[];
    if (mode === "compliance") return ["COMPLIANCE"] as ConsoleAdminRole[];
    if (mode === "treasury") return ["TREASURY"] as ConsoleAdminRole[];
    // "staff" — Support / Compliance / Treasury only
    return creatableRoles(actor.role).filter(isStaffRole);
  }, [actor.role, editAdmin, isEdit, mode]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCodes, setCountryCodes] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissionKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    countries?: string;
    permissions?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    if (editAdmin) {
      setRole(editAdmin.role);
      setUsername(editAdmin.username ?? "");
      setEmail(editAdmin.email ?? "");
      setCountryCodes(editAdmin.countryCodes);
      setPermissions(
        editAdmin.permissions.filter((k) =>
          actor.role === "SUPER_ADMIN" ? true : grantable.has(k),
        ),
      );
      setPassword("");
      setConfirmPassword("");
    } else {
      const nextRole = modeToRole(mode);
      setRole(nextRole);
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCountryCodes(
        actor.role !== "SUPER_ADMIN" && actor.countryCodes.length === 1
          ? [...actor.countryCodes]
          : [],
      );
      const defaults = DEFAULT_PERMISSIONS_BY_ROLE[nextRole].filter((k) =>
        grantable.has(k),
      );
      setPermissions(defaults);
    }
    setErrors({});
    setFormError(null);
  }, [open, mode, editAdmin, actor, grantable]);

  function applyRoleDefaults(next: ConsoleAdminRole) {
    setRole(next);
    if (next === "SUPER_ADMIN") {
      setCountryCodes([]);
      setPermissions([]);
      return;
    }
    setPermissions(
      DEFAULT_PERMISSIONS_BY_ROLE[next].filter((k) => grantable.has(k)),
    );
  }

  function togglePermission(key: AdminPermissionKey) {
    if (!grantable.has(key)) return;
    if (isStaffRole(role) && key === "users_roles") return;
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function resetForm() {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCountryCodes([]);
    setPermissions([]);
    setErrors({});
    setFormError(null);
  }

  function handleClose() {
    if (saving) return;
    resetForm();
    onClose();
  }

  function validate(): boolean {
    const next: typeof errors = {};

    if (!isEdit) {
      const usernameErr = validateAdminIdentifier(username);
      if (usernameErr && username.includes("@")) {
        next.username =
          "Username must be 3–32 characters and use letters, numbers, dots, hyphens, or underscores.";
      } else if (!username.trim()) {
        next.username = "Username is required.";
      } else if (usernameErr) {
        next.username = usernameErr;
      }

      const emailErr = validateAdminEmailDomain(email);
      if (emailErr) next.email = emailErr;

      const passwordErr = validateAdminPassword(password);
      if (passwordErr) next.password = passwordErr;

      const confirmErr = validateConfirmPassword(password, confirmPassword);
      if (confirmErr) next.confirmPassword = confirmErr;
    }

    if (needsCountries && countryCodes.length === 0) {
      next.countries = "Select at least one country.";
    }

    if (role !== "SUPER_ADMIN" && permissions.length === 0) {
      next.permissions = "Select at least one page permission.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEdit && editAdmin) {
        const body: Record<string, unknown> = {
          permissions: role === "SUPER_ADMIN" ? undefined : permissions,
          countryCodes: needsCountries ? countryCodes : undefined,
        };
        const res = await fetch(
          `/api/admin/admins/${encodeURIComponent(editAdmin.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              ...(body.permissions !== undefined
                ? { permissions: body.permissions }
                : {}),
              ...(body.countryCodes !== undefined
                ? { countryCodes: body.countryCodes }
                : {}),
            }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFormError(data?.message || "Could not update user.");
          return;
        }
      } else {
        const body: Record<string, unknown> = {
          username: username.trim(),
          email: email.trim(),
          password,
          role,
        };
        if (needsCountries) {
          body.countryCodes = countryCodes;
          body.permissions = permissions;
        }

        const res = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setFormError(
            data?.message || `Could not create ${ROLE_LABELS[role]}.`,
          );
          return;
        }
      }

      resetForm();
      await onSaved();
      onClose();
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const title = isEdit
    ? `Edit ${ROLE_LABELS[role]}`
    : `Create ${ROLE_LABELS[role]}`;

  const subtitle = isEdit
    ? "Update country access and page permissions."
    : role === "SUPER_ADMIN"
      ? "Full platform access across all countries."
      : "Assign countries and page permissions for this console user.";

  const showPermissionChecks = role !== "SUPER_ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-admin-title"
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 max-h-[min(90vh,720px)] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2
              id="create-admin-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
            {formError ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </p>
            ) : null}

            {!isEdit && roleOptions.length > 1 ? (
              <div>
                <label
                  htmlFor="modal-role"
                  className="text-sm font-medium text-slate-700 mb-1.5 block"
                >
                  Role
                </label>
                <select
                  id="modal-role"
                  value={role}
                  onChange={(e) =>
                    applyRoleDefaults(e.target.value as ConsoleAdminRole)
                  }
                  disabled={saving}
                  className={fieldControlBase}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!isEdit ? (
              <>
                <div>
                  <label
                    htmlFor="modal-username"
                    className="text-sm font-medium text-slate-700 mb-1.5 block"
                  >
                    Username
                  </label>
                  <input
                    id="modal-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors((p) => ({ ...p, username: undefined }));
                    }}
                    placeholder="kenya.ops"
                    autoComplete="username"
                    disabled={saving}
                    className={`${fieldControlBase} ${errors.username ? fieldControlError : ""}`}
                  />
                  {errors.username ? (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.username}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="modal-email"
                    className="text-sm font-medium text-slate-700 mb-1.5 block"
                  >
                    Email
                  </label>
                  <input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    placeholder="name@instaremit.co"
                    autoComplete="email"
                    disabled={saving}
                    className={`${fieldControlBase} ${errors.email ? fieldControlError : ""}`}
                  />
                  {errors.email ? (
                    <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p className="font-medium text-slate-900">
                  {editAdmin?.username || "—"}
                </p>
                <p className="text-slate-500">{editAdmin?.email || "—"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Role: {ROLE_LABELS[role]}
                </p>
              </div>
            )}

            {needsCountries ? (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Countries
                </label>
                <AdminMultiCountrySelect
                  value={countryCodes}
                  onChange={(codes) => {
                    setCountryCodes(codes);
                    setErrors((p) => ({ ...p, countries: undefined }));
                  }}
                  countries={countries}
                  loading={countriesLoading}
                  disabled={saving}
                  error={errors.countries}
                  placeholder="Select countries…"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  {actor.role === "SUPER_ADMIN"
                    ? "List shows registration-enabled countries from Manage Country."
                    : "You can only assign countries within your own access."}
                </p>
              </div>
            ) : null}

            {showPermissionChecks ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Page access
                </p>
                <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                  {ADMIN_PERMISSION_GROUPS.map((group) => {
                    const keys = group.keys.filter((k) => {
                      if (!grantable.has(k)) return false;
                      if (isStaffRole(role) && k === "users_roles") return false;
                      return true;
                    });
                    if (!keys.length) return null;
                    return (
                      <div key={group.label}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                          {group.label}
                        </p>
                        <div className="space-y-1.5">
                          {keys.map((key) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                                checked={permissions.includes(key)}
                                disabled={saving}
                                onChange={() => togglePermission(key)}
                              />
                              {ADMIN_PERMISSION_LABELS[key]}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.permissions ? (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.permissions}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Changing role resets checkboxes to that role&apos;s defaults.
                  </p>
                )}
              </div>
            ) : null}

            {!isEdit ? (
              <>
                <PasswordField
                  id="modal-password"
                  label="Password"
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
                    setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  error={errors.password}
                  disabled={saving}
                />

                <PasswordField
                  id="modal-confirm-password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    setErrors((p) => ({ ...p, confirmPassword: undefined }));
                  }}
                  error={errors.confirmPassword}
                  disabled={saving}
                />
              </>
            ) : null}
          </div>

          <div className="relative z-0 shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 h-10 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${adminButtonPrimary} w-auto px-6`}
            >
              {saving
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : `Create ${ROLE_LABELS[role]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
