import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Device/Browser classification (mirrors middleware)
function classifyUA(ua: string): { device: string; browser: string } {
  let device = "Desktop";
  let browser = "Other";
  if (/iPhone|iPad|iPod/.test(ua)) device = "iOS";
  else if (/Android/.test(ua)) device = "Android";
  else if (/Windows/.test(ua)) device = "Windows";
  else if (/Macintosh/.test(ua)) device = "Mac";

  if (/Instagram/.test(ua)) browser = "Instagram-IAB";
  else if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = "Facebook-IAB";
  else if (/GSA/.test(ua)) browser = "Google-App";
  else if (/Snapchat/.test(ua)) browser = "Snapchat-IAB";
  else if (/TikTok/.test(ua)) browser = "TikTok-IAB";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung-Browser";
  else if (/EdgA|Edg\//.test(ua)) browser = "Edge";
  else if (/CriOS/.test(ua)) browser = "Chrome-iOS";
  else if (/FxiOS/.test(ua)) browser = "Firefox-iOS";
  else if (/Chrome/.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua) && /Version\//.test(ua)) browser = "Safari";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  return { device, browser };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const country = req.headers.get("x-vercel-ip-country") || "??";
    const city = req.headers.get("x-vercel-ip-city") || "?";
    const { device, browser } = classifyUA(ua);

    const logType = body.level === "PAGE_LOAD" ? "PAGE_LOAD" : "CLIENT_ERROR";

    console.log(
      JSON.stringify({
        type: logType,
        ts: new Date().toISOString(),
        ip,
        geo: `${city}, ${country}`,
        device,
        browser,
        logLevel: body.level || "error",
        message: body.message,
        url: body.url,
        stack: body.stack || null,
        loadTime: body.loadTime || null,
        details: body.details || null,
      })
    );

    return NextResponse.json({ status: "received" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

