"use client";

import { useState } from "react";
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

type CreateAdminModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
};

export function CreateAdminModal({
  open,
  onClose,
  onCreated,
}: CreateAdminModalProps) {
  const { countries, loading: countriesLoading } = useRegistrationCountries(open);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCodes, setCountryCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    countries?: string;
  }>({});

  function resetForm() {
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setCountryCodes([]);
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

    if (countryCodes.length === 0) {
      next.countries = "Select at least one country.";
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
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          countryCodes,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data?.message || "Could not create admin user.");
        return;
      }

      resetForm();
      await onCreated();
      onClose();
    } catch {
      setFormError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-admin-title"
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 max-h-[min(90vh,720px)] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="create-admin-title" className="text-lg font-semibold text-slate-900">
              Create admin user
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Assign registration countries this admin can manage.
            </p>
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

            <div>
              <label htmlFor="modal-username" className="text-sm font-medium text-slate-700 mb-1.5 block">
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
                <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="modal-email" className="text-sm font-medium text-slate-700 mb-1.5 block">
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
                List shows registration-enabled countries from Manage Country.
              </p>
            </div>

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
              {saving ? "Creating…" : "Create admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
