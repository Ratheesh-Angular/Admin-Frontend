import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  return proxyAdminSessionApi(
    `/api/admin/transfers/${encodeURIComponent(id)}/trigger-payout`,
    { method: "POST" },
  );
}
