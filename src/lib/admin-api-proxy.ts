import { NextResponse } from "next/server";

export function adminApiBase(): string {
  return (process.env.CBP_API_BASE_URL || "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );
}

export function getAdminApiKey(): string | null {
  const key = process.env.CBP_ADMIN_API_KEY?.trim();
  return key || null;
}

export function adminKeyMissingResponse() {
  return NextResponse.json(
    { success: false, error: "Set CBP_ADMIN_API_KEY for this app." },
    { status: 503 },
  );
}

export async function proxyAdminApi(
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const key = getAdminApiKey();
  if (!key) return adminKeyMissingResponse();

  try {
    const r = await fetch(`${adminApiBase()}${path}`, {
      ...init,
      headers: {
        "x-admin-api-key": key,
        ...(init?.headers ?? {}),
      },
    });

    const text = await r.text();
    let data: unknown = {};
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          success: false,
          error: text || `Backend returned non-JSON (${r.status})`,
        };
      }
    } else if (!r.ok) {
      data = {
        success: false,
        error: `Backend returned empty response (${r.status})`,
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
        error: isRefused
          ? `Cannot reach backend at ${adminApiBase()}. Start cbp-backend with npm run dev.`
          : message,
      },
      { status: 503 },
    );
  }
}
