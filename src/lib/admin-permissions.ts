/** Page-level admin console permissions (mirrors cbp-backend). */

export const ADMIN_PERMISSION_KEYS = [
  "dashboard",
  "personal_users",
  "corporate_users",
  "remittance_individuals",
  "remittance_corporates",
  "currency_pair",
  "exchange_rates",
  "tariffs",
  "manage_country",
  "source_currency",
  "recipient_currency",
  "pay_in_methods",
  "card_fees",
  "users_roles",
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

export const ALL_PERMISSIONS: AdminPermissionKey[] = [...ADMIN_PERMISSION_KEYS];

export const ADMIN_PERMISSION_LABELS: Record<AdminPermissionKey, string> = {
  dashboard: "Dashboard",
  personal_users: "Personal Users",
  corporate_users: "Corporate Users",
  remittance_individuals: "Outbound List (Individuals)",
  remittance_corporates: "Outbound List (Corporates)",
  currency_pair: "Currency Pair",
  exchange_rates: "Exchange rates",
  tariffs: "Tariffs",
  manage_country: "Manage Country",
  source_currency: "Source Currency",
  recipient_currency: "Recipient Currency",
  pay_in_methods: "Pay-in Methods",
  card_fees: "Card Fees",
  users_roles: "Users & Roles",
};

/** Grouped for the permissions checkbox UI. */
export const ADMIN_PERMISSION_GROUPS: {
  label: string;
  keys: AdminPermissionKey[];
}[] = [
  { label: "General", keys: ["dashboard"] },
  { label: "Users KYC", keys: ["personal_users", "corporate_users"] },
  {
    label: "Remittance",
    keys: ["remittance_individuals", "remittance_corporates"],
  },
  {
    label: "Rate settings",
    keys: ["currency_pair", "exchange_rates", "tariffs"],
  },
  { label: "Manage Country", keys: ["manage_country"] },
  {
    label: "Payment settings",
    keys: [
      "source_currency",
      "recipient_currency",
      "pay_in_methods",
      "card_fees",
    ],
  },
  { label: "Administration", keys: ["users_roles"] },
];

export type ConsoleAdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUPPORT"
  | "COMPLIANCE"
  | "TREASURY";

export const STAFF_ROLES: ConsoleAdminRole[] = [
  "SUPPORT",
  "COMPLIANCE",
  "TREASURY",
];

export const ROLE_LABELS: Record<ConsoleAdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SUPPORT: "Support",
  COMPLIANCE: "Compliance",
  TREASURY: "Treasury",
};

const SUPPORT_DEFAULTS: AdminPermissionKey[] = [
  "dashboard",
  "remittance_individuals",
  "remittance_corporates",
];

const COMPLIANCE_DEFAULTS: AdminPermissionKey[] = [
  ...SUPPORT_DEFAULTS,
  "personal_users",
  "corporate_users",
];

const TREASURY_DEFAULTS: AdminPermissionKey[] = [
  "dashboard",
  "remittance_individuals",
  "remittance_corporates",
  "currency_pair",
  "exchange_rates",
  "tariffs",
];

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<
  ConsoleAdminRole,
  AdminPermissionKey[]
> = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  ADMIN: [...ALL_PERMISSIONS],
  SUPPORT: SUPPORT_DEFAULTS,
  COMPLIANCE: COMPLIANCE_DEFAULTS,
  TREASURY: TREASURY_DEFAULTS,
};

const PERMISSION_SET = new Set<string>(ADMIN_PERMISSION_KEYS);

export function isAdminPermissionKey(value: string): value is AdminPermissionKey {
  return PERMISSION_SET.has(value);
}

export function isConsoleAdminRole(value: string): value is ConsoleAdminRole {
  return value in ROLE_LABELS;
}

export function isStaffRole(role: ConsoleAdminRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function effectivePermissions(
  role: ConsoleAdminRole,
  stored: string[] | null | undefined,
): AdminPermissionKey[] {
  if (role === "SUPER_ADMIN") return [...ALL_PERMISSIONS];
  const fromStore = Array.isArray(stored)
    ? stored.filter(isAdminPermissionKey)
    : [];
  if (fromStore.length === 0) {
    return [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
  }
  if (isStaffRole(role)) {
    return fromStore.filter((k) => k !== "users_roles");
  }
  return fromStore;
}

export function hasPermission(
  role: ConsoleAdminRole,
  stored: string[] | null | undefined,
  key: AdminPermissionKey,
): boolean {
  return effectivePermissions(role, stored).includes(key);
}

export function canActorCreateRole(
  actorRole: ConsoleAdminRole,
  targetRole: ConsoleAdminRole,
): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  if (actorRole === "ADMIN") return isStaffRole(targetRole);
  return false;
}

/** Path → required permission for client-side page gates. */
export const PATH_PERMISSION: { prefix: string; key: AdminPermissionKey }[] = [
  { prefix: "/dashboard", key: "dashboard" },
  { prefix: "/personal-users", key: "personal_users" },
  { prefix: "/corporate-users", key: "corporate_users" },
  {
    prefix: "/payments/outbound/individuals",
    key: "remittance_individuals",
  },
  {
    prefix: "/payments/outbound/corporates",
    key: "remittance_corporates",
  },
  { prefix: "/rate-settings/currency-pair", key: "currency_pair" },
  { prefix: "/rate-settings/exchange-rates", key: "exchange_rates" },
  { prefix: "/rate-settings/tariffs", key: "tariffs" },
  { prefix: "/manage-country", key: "manage_country" },
  { prefix: "/source-currency", key: "source_currency" },
  { prefix: "/recipient-currency", key: "recipient_currency" },
  { prefix: "/pay-in-methods", key: "pay_in_methods" },
  { prefix: "/card-fees", key: "card_fees" },
  { prefix: "/roles", key: "users_roles" },
];

export function permissionForPath(pathname: string): AdminPermissionKey | null {
  const match = PATH_PERMISSION.find(
    (p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`),
  );
  return match?.key ?? null;
}
