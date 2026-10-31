/** Corridors admins may enable/disable on Manage Country; all others are locked. */
export const MANAGE_COUNTRY_UNLOCKED_CODES = [
  "UGA",
  "KEN",
  "TZA",
  "SSD",
  "GBR",
  "CAN",
] as const;

export type ManageCountryUnlockedCode =
  (typeof MANAGE_COUNTRY_UNLOCKED_CODES)[number];

export const MANAGE_COUNTRY_UNLOCKED_SET: ReadonlySet<string> = new Set(
  MANAGE_COUNTRY_UNLOCKED_CODES,
);

export function filterToUnlockedCodes(codes: Iterable<string>): string[] {
  return [...codes]
    .map((c) => String(c).trim().toUpperCase())
    .filter((c) => c && MANAGE_COUNTRY_UNLOCKED_SET.has(c));
}
