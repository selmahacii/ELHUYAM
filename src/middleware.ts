import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = /^\/admin(\/.*)?$/;
const AUTH_ROUTES = /^\/auth\/(login|register|forgot-password)/;
const PROTECTED_ROUTES = /^\/(account|wishlist)(\/.*)?$/;

const ADMIN_ROLES = new Set(["ADMIN", "CONFIRMATRICE"]);
const { auth } = NextAuth(authConfig);

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
  const path = nextUrl.pathname;

  if (ADMIN_ROUTES.test(path)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login?callbackUrl=/admin", nextUrl));
    }
    if (!canAccessAdmin) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (PROTECTED_ROUTES.test(path) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(path);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  if (AUTH_ROUTES.test(path) && isLoggedIn) {
    const dest = canAccessAdmin ? "/admin" : "/account";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  return NextResponse.next();
});

export default async function middleware(req: any, ctx: any) {
  const path = req.nextUrl.pathname;

  // FAST PATH: For all public routes (shop, homepage, static assets, etc.), 
  // bypass NextAuth JWT parsing and heavy logging to save 90%+ Vercel CPU time!
  const isProtectedOrAuth =
    ADMIN_ROUTES.test(path) ||
    PROTECTED_ROUTES.test(path) ||
    AUTH_ROUTES.test(path);

  if (!isProtectedOrAuth) {
    return NextResponse.next();
  }

  try {
    return await (authMiddleware as any)(req, ctx);
  } catch (error) {
    const res = NextResponse.next();
    for (const name of AUTH_COOKIE_NAMES) {
      res.cookies.delete(name);
    }
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico|css|js)$).*)",
  ],
};
