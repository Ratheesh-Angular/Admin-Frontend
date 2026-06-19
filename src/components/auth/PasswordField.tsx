"use client";

import { useState } from "react";
import {
  fieldControlBase,
  fieldControlError,
} from "@/lib/field-styles";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "Your password",
  autoComplete = "current-password",
  disabled = false,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 mb-1.5 block"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${fieldControlBase} pr-14 ${error ? fieldControlError : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 px-1"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
