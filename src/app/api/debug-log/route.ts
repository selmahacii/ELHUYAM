import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";

    console.log(
      "[CLIENT_LOG]",
      JSON.stringify({
        ts: new Date().toISOString(),
        ip,
        ua: ua.substring(0, 100),
        logLevel: body.level || "info",
        message: body.message,
        url: body.url,
        stack: body.stack,
        details: body.details,
      })
    );

    return NextResponse.json({ status: "received" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
