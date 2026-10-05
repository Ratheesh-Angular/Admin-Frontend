import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") ?? "";
  const qs = new URLSearchParams();
  if (countryCode) qs.set("countryCode", countryCode);
  const query = qs.toString();
  return proxyAdminSessionApi(
    `/api/admin/exchange-rates${query ? `?${query}` : ""}`,
  );
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/exchange-rates", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  const countryCode = searchParams.get("countryCode") ?? "";
  const currencyPairId = searchParams.get("currencyPairId") ?? "";
  if (countryCode) qs.set("countryCode", countryCode);
  if (currencyPairId) qs.set("currencyPairId", currencyPairId);
  const query = qs.toString();
  return proxyAdminSessionApi(
    `/api/admin/exchange-rates${query ? `?${query}` : ""}`,
    { method: "DELETE" },
  );
}
