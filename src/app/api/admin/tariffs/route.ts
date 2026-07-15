import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience") ?? "";
  const qs = audience ? `?audience=${encodeURIComponent(audience)}` : "";
  return proxyAdminSessionApi(`/api/admin/tariffs${qs}`);
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/tariffs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
