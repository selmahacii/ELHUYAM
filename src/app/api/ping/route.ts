import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const country = req.headers.get("x-vercel-ip-country") || "unknown";
  const city = req.headers.get("x-vercel-ip-city") || "unknown";
  const region = req.headers.get("x-vercel-ip-country-region") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const host = req.headers.get("host") || "unknown";
  const referer = req.headers.get("referer") || "-";

  const info = {
    status: "ok",
    timestamp: new Date().toISOString(),
    host,
    request_ip: ip,
    geo: { country, region, city },
    user_agent: ua,
    referer,
    dns_resolves_to: host,
    message: "✅ Si vous voyez cette page, le site est pleinement accessible depuis votre réseau !",
  };

  console.log("[PING]", JSON.stringify(info));

  return NextResponse.json(info, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
