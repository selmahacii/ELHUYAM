import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { name, email, subject, message } = parsed.data;

    // Non-blocking email send to store admin
    if (process.env.SMTP_HOST && process.env.ADMIN_EMAIL) {
      const { default: nodemailer } = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      transporter.sendMail({
        from: process.env.SMTP_FROM ?? "EL HUYAM <noreply@elhuyaam.com>",
        to: process.env.ADMIN_EMAIL,
        subject: `[Contact] ${subject}`,
        html: `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br>")}</p>`,
      }).catch(() => null);
    }

    return successResponse({ message: "Message sent successfully." });
  } catch {
    return errorResponse("Failed to send message.", 500);
  }
}
