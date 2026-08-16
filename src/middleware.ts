import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = /^\/admin(\/.*)?$/;
const AUTH_ROUTES = /^\/auth\/(login|register|forgot-password)/;
const PROTECTED_ROUTES = /^\/(account|wishlist)(\/.*)?$/;

// Roles that can access the admin panel
const ADMIN_ROLES = new Set(["ADMIN", "CONFIRMATRICE"]);

const { auth } = NextAuth(authConfig);

// ── Device / Browser detection ──────────────────────────────────────────────
function classifyUA(ua: string): { device: string; browser: string } {
  let device = "Desktop";
  let browser = "Other";

  // Device
  if (/iPhone|iPad|iPod/.test(ua)) device = "iOS";
  else if (/Android/.test(ua)) device = "Android";
  else if (/Windows/.test(ua)) device = "Windows";
  else if (/Macintosh/.test(ua)) device = "Mac";

  // Browser / source
  if (/Instagram/.test(ua)) browser = "Instagram-IAB";
  else if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = "Facebook-IAB";
  else if (/GSA/.test(ua)) browser = "Google-App";
  else if (/Snapchat/.test(ua)) browser = "Snapchat-IAB";
  else if (/TikTok/.test(ua)) browser = "TikTok-IAB";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung-Browser";
  else if (/EdgA|Edg\//.test(ua)) browser = "Edge";
  else if (/OPR|Opera/.test(ua)) browser = "Opera";
  else if (/CriOS/.test(ua)) browser = "Chrome-iOS";
  else if (/FxiOS/.test(ua)) browser = "Firefox-iOS";
  else if (/Chrome/.test(ua) && !/Chromium/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua) && /Version\//.test(ua)) browser = "Safari";
  else if (/Firefox/.test(ua)) browser = "Firefox";

  return { device, browser };
}

const AUTH_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

const authMiddleware = auth((req: any) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user?.role ?? "";
  const canAccessAdmin = ADMIN_ROLES.has(role);

  // ── Comprehensive Request Logging ──────────────────────────────────────────
  const now = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.ip ||
    "unknown";
  const country = req.headers.get("x-vercel-ip-country") || "??";
  const city = req.headers.get("x-vercel-ip-city") || "?";
  const ua = req.headers.get("user-agent") || "unknown";
  const referer = req.headers.get("referer") || "-";
  const host = req.headers.get("host") || "unknown";
  const method = req.method;
  const path = nextUrl.pathname + (nextUrl.search || "");
  const userId = session?.user?.id ?? "anonymous";
  const userRole = role || "guest";
  const { device, browser } = classifyUA(ua);

  // Structured visit log — classifies device/browser for easy filtering
  console.log(
    JSON.stringify({
      type: "VISIT",
      ts: now,
      method,
      host,
      path,
      ip,
      geo: `${city}, ${country}`,
      device,
      browser,
      user: userId,
      role: userRole,
      referer: referer.substring(0, 120),
    })
  );

  if (ADMIN_ROUTES.test(nextUrl.pathname)) {
    if (!isLoggedIn) {
      console.log(JSON.stringify({ type: "REDIRECT", ts: now, ip, geo: `${city}, ${country}`, device, browser, reason: "unauthenticated", from: path, to: "/auth/login" }));
      return NextResponse.redirect(new URL("/auth/login?callbackUrl=/admin", nextUrl));
    }
    if (!canAccessAdmin) {
      console.log(JSON.stringify({ type: "REDIRECT", ts: now, ip, geo: `${city}, ${country}`, device, browser, reason: "unauthorized", role, from: path, to: "/" }));
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (PROTECTED_ROUTES.test(nextUrl.pathname) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    console.log(JSON.stringify({ type: "REDIRECT", ts: now, ip, geo: `${city}, ${country}`, device, browser, reason: "not_logged_in", from: path, to: `/auth/login?callbackUrl=${callbackUrl}` }));
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  if (AUTH_ROUTES.test(nextUrl.pathname) && isLoggedIn) {
    const dest = canAccessAdmin ? "/admin" : "/account";
    console.log(JSON.stringify({ type: "REDIRECT", ts: now, ip, geo: `${city}, ${country}`, device, browser, reason: "already_logged_in", from: path, to: dest }));
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  return NextResponse.next();
});

// A corrupt/stale session cookie (e.g. left over from a secret rotation or a
// different deployment) makes NextAuth's JWT decode throw, which previously
// crashed the middleware and blocked the whole site for that visitor —
// while a fresh/private browser with no cookie worked fine. Catch it, wipe
// the bad cookie, and let the request through instead of failing the page.
export default async function middleware(req: any, ctx: any) {
  try {
    return await (authMiddleware as any)(req, ctx);
  } catch (error) {
    console.log(
      JSON.stringify({
        type: "MIDDLEWARE_AUTH_ERROR",
        ts: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
      })
    );
    const res = NextResponse.next();
    for (const name of AUTH_COOKIE_NAMES) {
      res.cookies.delete(name);
    }
    return res;
  }
}

// Run middleware on ALL page requests so Vercel logs capture every single visitor
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico|css|js)$).*)",
  ],
};
