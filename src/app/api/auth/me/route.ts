import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminApiBase } from "@/lib/admin-api-base";
import { ADMIN_SESSION_COOKIE } from "@/lib/session-cookie";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value?.trim();
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, {
      status: 401,
    });
  }

  try {
    const r = await fetch(`${adminApiBase()}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Cannot reach backend." },
      { status: 503 },
    );
  }
}
