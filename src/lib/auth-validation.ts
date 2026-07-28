const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const ALLOWED_ADMIN_EMAIL_DOMAINS = ["instaremit.co", "flex-money.com"] as const;

export function validateAdminEmailDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  const domain = trimmed.split("@")[1];
  if (
    !domain ||
    !ALLOWED_ADMIN_EMAIL_DOMAINS.includes(
      domain as (typeof ALLOWED_ADMIN_EMAIL_DOMAINS)[number],
    )
  ) {
    return "Email must use @instaremit.co or @flex-money.com.";
  }
  return null;
}

export function validateAdminIdentifier(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Username or email address is required.";
  if (trimmed.includes("@")) {
    if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
    return null;
  }
  if (!USERNAME_RE.test(trimmed)) {
    return "Username must be 3–32 characters and use letters, numbers, dots, hyphens, or underscores.";
  }
  return null;
}

export function validateAdminPassword(
  password: string,
  options?: { allowEmpty?: boolean },
): string | null {
  if (!password) {
    return options?.allowEmpty ? null : "Password is required.";
  }
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password))
    return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(password))
    return "Password must include an uppercase letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must include a special character.";
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) return "Please confirm your password.";
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}
