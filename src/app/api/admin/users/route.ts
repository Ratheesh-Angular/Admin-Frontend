import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") ?? "";
  const qs = role ? `?role=${encodeURIComponent(role)}` : "";
  return proxyAdminSessionApi(`/api/admin/users${qs}`);
}
