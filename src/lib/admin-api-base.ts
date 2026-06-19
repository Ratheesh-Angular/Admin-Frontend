export function adminApiBase(): string {
  return (process.env.CBP_API_BASE_URL || "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );
}
