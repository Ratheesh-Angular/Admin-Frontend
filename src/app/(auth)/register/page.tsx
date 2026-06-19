"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import R2GLogo from "../../../../assets/logos/R2GLogo.png";
import { AdminLoadingOverlay } from "@/components/ui/AdminLoadingOverlay";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  adminButtonPrimary,
  adminLink,
  fieldControlBase,
  fieldControlError,
} from "@/lib/field-styles";
import {
  validateAdminIdentifier,
  validateAdminPassword,
  validateConfirmPassword,
} from "@/lib/auth-validation";

export default function AdminRegisterPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): boolean {
    const next: typeof errors = {};
    const idErr = validateAdminIdentifier(identifier);
    if (idErr) next.identifier = idErr;

    const pwdErr = validateAdminPassword(password);
    if (pwdErr) next.password = pwdErr;

    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) next.confirmPassword = confirmErr;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const apiMessage =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          "Registration failed. Please try again.";
        setErrors({ form: apiMessage });
        return;
      }

      const token = data.data?.token as string | undefined;
      if (!token) {
        setErrors({ form: "Account created but session setup failed." });
        return;
      }

      const sessRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token }),
      });
      if (!sessRes.ok) {
        setErrors({ form: "Could not save your session. Please sign in." });
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <AdminLoadingOverlay show={isLoading} label="Creating account…" />
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8 mt-8">
        <div className="flex justify-center mb-6">
          <Image
            src={R2GLogo}
            alt="Remit2Globe"
            priority
            className="object-contain w-[125px]"
          />
        </div>

        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            Admin
          </span>
        </div>

        <div className="mb-6 mt-3 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Create admin account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register for the Remit2Globe admin console
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="text-sm font-medium text-slate-700 mb-1.5 block"
            >
              Username or email address
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  identifier: undefined,
                  form: undefined,
                }));
              }}
              placeholder="admin or you@company.com"
              autoComplete="username"
              disabled={isLoading}
              className={`${fieldControlBase} ${errors.identifier ? fieldControlError : ""}`}
            />
            {errors.identifier ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.identifier}</p>
            ) : null}
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                form: undefined,
              }));
            }}
            error={errors.password}
            placeholder="Create a strong password"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setErrors((prev) => ({
                ...prev,
                confirmPassword: undefined,
                form: undefined,
              }));
            }}
            error={errors.confirmPassword}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <p className="text-xs text-slate-500 leading-relaxed">
            Use at least 8 characters with uppercase, lowercase, a number, and a
            special character.
          </p>

          {errors.form ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {errors.form}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className={`${adminButtonPrimary} mt-2`}
          >
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className={adminLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
