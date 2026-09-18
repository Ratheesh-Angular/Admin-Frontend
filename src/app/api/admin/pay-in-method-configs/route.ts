import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get("countryCode") ?? "";
  const qs = new URLSearchParams();
  if (countryCode) qs.set("countryCode", countryCode);
  const query = qs.toString();
  return proxyAdminSessionApi(
    `/api/admin/pay-in-method-configs${query ? `?${query}` : ""}`,
  );
}

export async function PUT(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/pay-in-method-configs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
