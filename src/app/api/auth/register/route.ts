import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per IP per hour
  const ip = getClientIp(req);
  if (!rateLimit(ip, "register", 5, 60 * 60 * 1000)) {
    return errorResponse("Trop de tentatives. Réessayez dans une heure.", 429);
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return errorResponse("An account with this email already exists", 409);

    const hashed = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    await sendWelcomeEmail(name, email).catch(() => null); // Non-blocking

    return successResponse(user, 201);
  } catch {
    return errorResponse("Registration failed. Please try again.", 500);
  }
}
