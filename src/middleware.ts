import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = /^\/admin(\/.*)?$/;
const AUTH_ROUTES = /^\/auth\/(login|register|forgot-password)/;
const PROTECTED_ROUTES = /^\/(account|wishlist)(\/.*)?$/;

// Roles that can access the admin panel
const ADMIN_ROLES = new Set(["ADMIN", "CONFIRMATRICE"]);

const { auth } = NextAuth(authConfig);

export default auth((req: any) => {
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
  const country = req.headers.get("x-vercel-ip-country") || "unknown";
  const city = req.headers.get("x-vercel-ip-city") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const referer = req.headers.get("referer") || "-";
  const host = req.headers.get("host") || "unknown";
  const method = req.method;
  const path = nextUrl.pathname + (nextUrl.search || "");
  const userId = session?.user?.id ?? "anonymous";
  const userRole = role || "guest";

  // Log every page visit cleanly
  console.log(
    `[VISIT_LOG] ${now} | ${method} ${host}${path} | IP: ${ip} | Geo: ${city}, ${country} | User: ${userId} (${userRole}) | UA: ${ua.substring(0, 100)}`
  );

  if (ADMIN_ROUTES.test(nextUrl.pathname)) {
    if (!isLoggedIn) {
      console.log(`[REDIRECT] ${ip} → /auth/login (unauthenticated admin access attempt: ${path})`);
      return NextResponse.redirect(new URL("/auth/login?callbackUrl=/admin", nextUrl));
    }
    if (!canAccessAdmin) {
      console.log(`[REDIRECT] ${ip} userId=${userId} role=${role} → / (unauthorized admin access: ${path})`);
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (PROTECTED_ROUTES.test(nextUrl.pathname) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    console.log(`[REDIRECT] ${ip} → /auth/login?callbackUrl=${callbackUrl} (protected route, not logged in)`);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  if (AUTH_ROUTES.test(nextUrl.pathname) && isLoggedIn) {
    const dest = canAccessAdmin ? "/admin" : "/account";
    console.log(`[REDIRECT] ${ip} userId=${userId} → ${dest} (already logged in, redirecting from auth route)`);
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  return NextResponse.next();
});

// Run middleware on ALL page requests so Vercel logs capture every single visitor
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico|css|js)$).*)",
  ],
};
