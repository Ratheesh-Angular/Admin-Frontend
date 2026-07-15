import { getAdminSessionToken } from "@/lib/admin-session-proxy";
import { adminApiBase } from "@/lib/admin-api-base";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const token = await getAdminSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, {
      status: 401,
    });
  }

  const { id } = await params;

  try {
    const r = await fetch(
      `${adminApiBase()}/api/admin/users/${encodeURIComponent(id)}/kyc-documents/zip`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!r.ok) {
      const text = await r.text();
      let data: unknown = { success: false, error: "Download failed." };
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, error: text || "Download failed." };
      }
      return NextResponse.json(data, { status: r.status });
    }

    const buffer = await r.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("Content-Type") ?? "application/zip",
        "Content-Disposition":
          r.headers.get("Content-Disposition") ??
          `attachment; filename="kyc-${id}.zip"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reach backend";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
