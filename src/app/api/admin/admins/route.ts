import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET() {
  return proxyAdminSessionApi("/api/admin/auth/admins");
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/auth/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
