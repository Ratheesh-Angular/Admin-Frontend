import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET() {
  return proxyAdminSessionApi("/api/admin/admins");
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
