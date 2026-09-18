import { NextResponse } from "next/server";
import { adminApiBase } from "@/lib/admin-api-base";
import { getAdminSessionToken } from "@/lib/admin-session-proxy";

const base = () =>
  (process.env.CBP_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function getKey() {
  const key = process.env.CBP_ADMIN_API_KEY?.trim();
  if (!key) return null;
  return key;
}

export async function GET() {
  const key = getKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Set CBP_ADMIN_API_KEY for this app." },
      { status: 503 },
    );
  }
  const r = await fetch(`${base()}/api/admin/country-allowlist`, {
    headers: { "x-admin-api-key": key },
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function PUT(req: Request) {
  const token = await getAdminSessionToken();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const meRes = await fetch(`${adminApiBase()}/api/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            (meData as { message?: string; error?: string })?.message ||
            (meData as { error?: string })?.error ||
            "Not authenticated",
        },
        { status: meRes.status },
      );
    }
    const role = (meData as { data?: { admin?: { role?: string } } })?.data
      ?.admin?.role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only super admins can change countries of operation.",
        },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Cannot reach backend." },
      { status: 503 },
    );
  }

  const key = getKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Set CBP_ADMIN_API_KEY for this app." },
      { status: 503 },
    );
  }
  const body = await req.text();
  const r = await fetch(`${base()}/api/admin/country-allowlist`, {
    method: "PUT",
    headers: {
      "x-admin-api-key": key,
      "Content-Type": "application/json",
    },
    body: body || "{}",
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
