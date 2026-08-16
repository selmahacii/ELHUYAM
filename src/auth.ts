import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "./auth.config";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (vs NextAuth default 30 days)

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "3hnXt4WIWhXRm1+Ewu8etk2Jg6jeC+cmnizOIAWIWpc=",
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // Refresh token once per day on activity
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Login attempt started for email:", credentials?.email);
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log("[AUTH] Schema validation failed for credentials:", parsed.error.format());
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
          console.log("[AUTH] No user found in database with email:", email);
          return null;
        }
        if (!user.password) {
          console.log("[AUTH] User exists but has no password set:", email);
          return null;
        }
        if (user.isBanned) {
          console.log("[AUTH] Account is suspended/banned for email:", email);
          throw new Error("Account suspended");
        }

        const valid = await bcrypt.compare(password, user.password);
        console.log("[AUTH] Password verification result for email", email, ":", valid);
        if (!valid) {
          console.log("[AUTH] Invalid password entered for email:", email);
          return null;
        }

        console.log("[AUTH] Login successful for email:", email, "with role:", user.role);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
