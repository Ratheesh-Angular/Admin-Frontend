import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminSessionApi(`/api/admin/tariffs/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return proxyAdminSessionApi(`/api/admin/tariffs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
