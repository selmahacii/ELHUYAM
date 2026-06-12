import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 10 attempts per IP per 15 minutes
  const ip = getClientIp(req);
  if (!rateLimit(ip, "reset-password", 10, 15 * 60 * 1000)) {
    return errorResponse("Trop de tentatives. Réessayez dans 15 minutes.", 429);
  }

  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { token, password } = parsed.data;

    // Hash the incoming raw token and look up by hash — never store raw tokens
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await db.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExp: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return errorResponse("Lien invalide ou expiré.", 400);
    }

    const hashed = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExp: null },
    });

    return successResponse({ message: "Mot de passe mis à jour avec succès." });
  } catch {
    return errorResponse("Échec de la réinitialisation.", 500);
  }
}
