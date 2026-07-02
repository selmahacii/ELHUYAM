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

  if (ADMIN_ROUTES.test(nextUrl.pathname)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/login?callbackUrl=/admin", nextUrl));
    }
    if (!canAccessAdmin) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (PROTECTED_ROUTES.test(nextUrl.pathname) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  if (AUTH_ROUTES.test(nextUrl.pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL(canAccessAdmin ? "/admin" : "/account", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
