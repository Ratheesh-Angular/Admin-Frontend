import { proxyAdminApi } from "@/lib/admin-api-proxy";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAdminApi(`/api/admin/transfers/${id}/trigger-payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
