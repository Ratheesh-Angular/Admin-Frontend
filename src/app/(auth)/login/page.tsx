"use client";

import { useRef, useState } from "react";
import { FlexLogo } from "@/components/brand/FlexLogo";
import { AdminLoadingOverlay } from "@/components/ui/AdminLoadingOverlay";
import { PasswordField } from "@/components/auth/PasswordField";
import {
  adminButtonPrimary,
  adminLink,
  fieldControlBase,
  fieldControlError,
} from "@/lib/field-styles";
import { validateAdminIdentifier } from "@/lib/auth-validation";

type LoginStep = "credentials" | "otp";

const EMPTY_OTP = ["", "", "", "", "", ""] as const;

export default function AdminLoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>([...EMPTY_OTP]);
  const [challengeToken, setChallengeToken] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [otpDemoMode, setOtpDemoMode] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    otp?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function validateCredentials(): boolean {
    const next: typeof errors = {};
    const idErr = validateAdminIdentifier(identifier);
    if (idErr) next.identifier = idErr;
    if (!password.trim()) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function establishSession(token: string): Promise<boolean> {
    const sessRes = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token }),
    });
    return sessRes.ok;
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    window.location.assign(
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/dashboard",
    );
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCredentials()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const apiMessage =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          "Sign in failed. Please try again.";
        setErrors({ form: apiMessage });
        return;
      }

      if (data.data?.requiresOtp && data.data?.challengeToken) {
        setChallengeToken(String(data.data.challengeToken));
        setEmailHint(
          typeof data.data.emailHint === "string" ? data.data.emailHint : "",
        );
        setOtpDemoMode(data.data?.otpDemoMode === true);
        setOtp([...EMPTY_OTP]);
        setStep("otp");
        setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
        return;
      }

      // Legacy fallback if backend still returns a session token
      const token = data.data?.token as string | undefined;
      if (!token) {
        setErrors({ form: "Sign in succeeded but session setup failed." });
        return;
      }

      if (!(await establishSession(token))) {
        setErrors({ form: "Could not save your session. Please try again." });
        return;
      }

      redirectAfterLogin();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  function clearOtpInputs() {
    setOtp([...EMPTY_OTP]);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
  }

  async function verifyOtpCode(code: string) {
    if (!/^\d{6}$/.test(code)) {
      setErrors({ otp: "Enter the 6-digit code from your email." });
      return;
    }

    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const apiMessage =
          (typeof data?.message === "string" && data.message) ||
          "Verification failed. Please try again.";
        setErrors({ form: apiMessage });
        clearOtpInputs();
        return;
      }

      const token = data.data?.token as string | undefined;
      if (!token) {
        setErrors({ form: "Verification succeeded but session setup failed." });
        return;
      }

      if (!(await establishSession(token))) {
        setErrors({ form: "Could not save your session. Please try again." });
        return;
      }

      redirectAfterLogin();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    await verifyOtpCode(otp.join(""));
  }

  function handleOtpChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      setErrors((prev) => ({ ...prev, otp: undefined, form: undefined }));
      return;
    }

    // Paste / autofill: distribute digits across boxes
    if (digits.length > 1) {
      const next: string[] = [...EMPTY_OTP];
      const chars = digits.slice(0, 6).split("");
      chars.forEach((d, i) => {
        next[i] = d;
      });
      setOtp(next);
      setErrors((prev) => ({ ...prev, otp: undefined, form: undefined }));
      const focusAt = Math.min(chars.length, 5);
      otpInputRefs.current[focusAt]?.focus();
      if (next.every((d) => d !== "")) {
        void verifyOtpCode(next.join(""));
      }
      return;
    }

    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    setErrors((prev) => ({ ...prev, otp: undefined, form: undefined }));

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      void verifyOtpCode(next.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    handleOtpChange(0, digits);
  }

  async function handleResendOtp() {
    if (!challengeToken || isResending || isLoading) return;
    setIsResending(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        const apiMessage =
          (typeof data?.message === "string" && data.message) ||
          "Could not resend the code. Please try again.";
        setErrors({ form: apiMessage });
        return;
      }

      if (typeof data.data?.challengeToken === "string") {
        setChallengeToken(data.data.challengeToken);
      }
      if (typeof data.data?.emailHint === "string") {
        setEmailHint(data.data.emailHint);
      }
      if (typeof data.data?.otpDemoMode === "boolean") {
        setOtpDemoMode(data.data.otpDemoMode);
      }
      clearOtpInputs();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setIsResending(false);
    }
  }

  function handleBackToCredentials() {
    setStep("credentials");
    setChallengeToken("");
    setEmailHint("");
    setOtpDemoMode(false);
    setOtp([...EMPTY_OTP]);
    setErrors({});
  }

  const overlayLabel =
    step === "otp"
      ? isResending
        ? "Sending code…"
        : "Verifying…"
      : "Signing in…";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <AdminLoadingOverlay
        show={isLoading || isResending}
        label={overlayLabel}
      />
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <FlexLogo priority />
        </div>

        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            Admin
          </span>
        </div>

        {step === "credentials" ? (
          <>
            <h1 className="text-xl font-semibold text-slate-900 mb-1 mt-3 text-center">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mb-6 text-center">
              Sign in to the Flex Money admin console
            </p>

            <form
              onSubmit={handleCredentialsSubmit}
              noValidate
              className="space-y-4"
            >
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
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.identifier}
                  </p>
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
                disabled={isLoading}
              />

              {errors.form ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {errors.form}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className={adminButtonPrimary}
              >
                {isLoading ? "Signing in…" : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-slate-900 mb-1 mt-3 text-center">
              Check your email
            </h1>
            <p className="text-sm text-slate-500 mb-6 text-center">
              {otpDemoMode ? (
                <>
                  Local testing — enter any 6-digit code
                  {emailHint ? (
                    <>
                      {" "}
                      (email would go to{" "}
                      <span className="font-medium text-slate-700">
                        {emailHint}
                      </span>
                      )
                    </>
                  ) : null}
                  .
                </>
              ) : (
                <>
                  Enter the 6-digit code we sent
                  {emailHint ? (
                    <>
                      {" "}
                      to{" "}
                      <span className="font-medium text-slate-700">
                        {emailHint}
                      </span>
                    </>
                  ) : (
                    " to your email"
                  )}
                  .
                </>
              )}
            </p>

            <form onSubmit={handleOtpSubmit} noValidate className="space-y-4">
              <div>
                <p className="sr-only" id="otp-label">
                  Verification code
                </p>
                <div
                  className="flex gap-2 justify-center"
                  role="group"
                  aria-labelledby="otp-label"
                >
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={isLoading || isResending}
                      aria-label={`Digit ${index + 1} of 6`}
                      className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                        errors.otp
                          ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                          : "border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                    />
                  ))}
                </div>
                {errors.otp ? (
                  <p className="mt-2 text-xs text-red-500 text-center">
                    {errors.otp}
                  </p>
                ) : null}
              </div>

              {errors.form ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {errors.form}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoading || isResending || otp.some((d) => !d)}
                className={adminButtonPrimary}
              >
                {isLoading ? "Verifying…" : "Verify and sign in"}
              </button>

              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  disabled={isLoading || isResending}
                  className={adminLink}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || isResending}
                  className={adminLink}
                >
                  {isResending ? "Sending…" : "Resend code"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
