import { proxyAdminApi } from "@/lib/admin-api-proxy";

export async function GET() {
  return proxyAdminApi("/api/admin/transfers");
}
