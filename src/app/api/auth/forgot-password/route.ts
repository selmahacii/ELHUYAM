import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Constant success message — never reveal whether email exists
const SUCCESS = { message: "Si un compte existe, un email de réinitialisation a été envoyé." };

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per IP per 15 minutes
  const ip = getClientIp(req);
  if (!rateLimit(ip, "forgot-password", 5, 15 * 60 * 1000)) {
    return errorResponse("Trop de tentatives. Réessayez dans 15 minutes.", 429);
  }

  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { email } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });

    // Anti-enumeration: always return the same response and take ~same time
    if (!user) {
      // Simulate bcrypt-like delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 100));
      return successResponse(SUCCESS);
    }

    // Generate cryptographically random token (raw — sent in email)
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Store SHA-256 hash — if DB is breached, raw tokens cannot be derived
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExp: expiry },
    });

    await sendPasswordResetEmail(user.name ?? "Customer", email, rawToken);

    return successResponse(SUCCESS);
  } catch {
    return errorResponse("Échec de l'envoi de l'email.", 500);
  }
}
