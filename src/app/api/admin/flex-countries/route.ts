import { NextResponse } from "next/server";

const base = () =>
  (process.env.CBP_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function GET() {
  const key = process.env.CBP_ADMIN_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Set CBP_ADMIN_API_KEY for this app." },
      { status: 503 },
    );
  }
  const r = await fetch(`${base()}/api/admin/flex-countries`, {
    headers: { "x-admin-api-key": key },
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
