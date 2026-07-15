import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminApiBase } from "@/lib/admin-api-base";
import { ADMIN_SESSION_COOKIE } from "@/lib/session-cookie";

export async function getAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value?.trim();
  return token || null;
}

export async function proxyAdminSessionApi(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const token = await getAdminSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, {
      status: 401,
    });
  }

  try {
    const r = await fetch(`${adminApiBase()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const text = await r.text();
    let data: unknown = {};
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: false,
          message: text || `Backend returned non-JSON (${r.status})`,
        };
      }
    } else if (!r.ok) {
      data = {
        success: false,
        message: `Backend returned empty response (${r.status})`,
      };
    }

    return NextResponse.json(data, { status: r.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reach backend";
    const isRefused =
      message.includes("ECONNREFUSED") || message.includes("fetch failed");

    return NextResponse.json(
      {
        success: false,
        message: isRefused
          ? `Cannot reach backend at ${adminApiBase()}. Start cbp-backend with npm run dev.`
          : message,
      },
      { status: 503 },
    );
  }
}
