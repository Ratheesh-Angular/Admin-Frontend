import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/tariffs/schedule", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  const audience = searchParams.get("audience") ?? "";
  const countryCode = searchParams.get("countryCode") ?? "";
  const currencyPairId = searchParams.get("currencyPairId") ?? "";
  if (audience) qs.set("audience", audience);
  if (countryCode) qs.set("countryCode", countryCode);
  if (currencyPairId) qs.set("currencyPairId", currencyPairId);
  const query = qs.toString();
  return proxyAdminSessionApi(
    `/api/admin/tariffs/schedule${query ? `?${query}` : ""}`,
    { method: "DELETE" },
  );
}
