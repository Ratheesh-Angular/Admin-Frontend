import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const userId = searchParams.get("userId");
  const qs = new URLSearchParams();
  if (role) qs.set("role", role);
  if (userId) qs.set("userId", userId);
  const query = qs.toString();
  return proxyAdminSessionApi(`/api/admin/transfers${query ? `?${query}` : ""}`);
}
