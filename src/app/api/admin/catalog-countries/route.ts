import { NextResponse } from "next/server";

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
  const r = await fetch(`${base()}/api/admin/catalog-countries`, {
    headers: { "x-admin-api-key": key },
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function PUT(req: Request) {
  const key = getKey();
  if (!key) {
    return NextResponse.json(
      { success: false, error: "Set CBP_ADMIN_API_KEY for this app." },
      { status: 503 },
    );
  }
  const body = await req.text();
  const r = await fetch(`${base()}/api/admin/catalog-countries`, {
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
