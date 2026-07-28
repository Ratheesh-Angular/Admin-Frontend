import { proxyAdminSessionApi } from "@/lib/admin-session-proxy";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await request.text();
  return proxyAdminSessionApi(`/api/admin/admins/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  return proxyAdminSessionApi(
    `/api/admin/admins/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
