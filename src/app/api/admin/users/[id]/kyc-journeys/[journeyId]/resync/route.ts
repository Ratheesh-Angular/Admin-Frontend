import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

type Params = { params: Promise<{ id: string; journeyId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id, journeyId } = await params;
  return proxyAdminSessionApi(
    `/api/admin/users/${encodeURIComponent(id)}/kyc-journeys/${encodeURIComponent(journeyId)}/resync`,
    { method: "POST" },
  );
}
