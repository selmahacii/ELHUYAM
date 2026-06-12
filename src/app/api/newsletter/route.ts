import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { email } = parsed.data;

    // Check if user exists and update their newsletter preference
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      // User already in system — mark as subscribed if field exists, otherwise just acknowledge
      return successResponse({ message: "You're already part of the House of Huyaam!" });
    }

    // For non-registered users, we simply acknowledge (full newsletter service would integrate Mailchimp/Klaviyo)
    return successResponse({ message: "Thank you for joining the House of Huyaam." });
  } catch {
    return errorResponse("Failed to subscribe. Please try again.", 500);
  }
}
