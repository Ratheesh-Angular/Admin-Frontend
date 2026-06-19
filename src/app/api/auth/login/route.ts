import { NextResponse } from "next/server";
import { adminApiBase } from "@/lib/admin-api-base";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const r = await fetch(`${adminApiBase()}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: `Cannot reach backend at ${adminApiBase()}.`,
      },
      { status: 503 },
    );
  }
}
