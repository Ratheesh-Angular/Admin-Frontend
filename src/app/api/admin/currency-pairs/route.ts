import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

export async function GET() {
  return proxyAdminSessionApi("/api/admin/currency-pairs");
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyAdminSessionApi("/api/admin/currency-pairs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
