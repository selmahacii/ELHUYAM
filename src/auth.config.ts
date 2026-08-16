import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "3hnXt4WIWhXRm1+Ewu8etk2Jg6jeC+cmnizOIAWIWpc=",
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return url;
      try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        if (urlObj.origin === baseObj.origin || urlObj.hostname.endsWith("elhuyam.com") || urlObj.hostname.endsWith("vercel.app")) {
          return url;
        }
      } catch {}
      return baseUrl;
    },
  },
  providers: [], // Providers that require Node.js (like bcrypt/Prisma) will be added in auth.ts
} satisfies NextAuthConfig;
