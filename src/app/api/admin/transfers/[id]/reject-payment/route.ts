import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminSessionApi(
    `/api/admin/transfers/${encodeURIComponent(id)}/reject-payment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );
}
