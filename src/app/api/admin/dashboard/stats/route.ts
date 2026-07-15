import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET() {
  return proxyAdminSessionApi("/api/admin/dashboard/stats", { method: "GET" });
}
