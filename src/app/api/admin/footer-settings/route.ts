import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const footerSettingsSchema = z.object({
  contactTitle: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email("Format d'adresse e-mail invalide").or(z.literal("")),
  phone: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Non autorisé", 401);

    const contactTitleSetting = await db.setting.findUnique({ where: { key: "footer_contact_title" } });
    const addressSetting = await db.setting.findUnique({ where: { key: "footer_address" } });
    const emailSetting = await db.setting.findUnique({ where: { key: "footer_email" } });
    const phoneSetting = await db.setting.findUnique({ where: { key: "footer_phone" } });

    return successResponse({
      contactTitle: contactTitleSetting?.value || "",
      address: addressSetting?.value || "Algérie",
      email: emailSetting?.value || "hello@elhuyaam.com",
      phone: phoneSetting?.value || "+213 772 51 54 48",
    });
  } catch {
    return errorResponse("Impossible de charger la configuration du pied de page", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Non autorisé", 401);

    const body = await req.json();
    const parsed = footerSettingsSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { contactTitle, address, email, phone } = parsed.data;

    await db.setting.upsert({
      where: { key: "footer_contact_title" },
      create: { key: "footer_contact_title", value: contactTitle || "" },
      update: { value: contactTitle || "" },
    });

    await db.setting.upsert({
      where: { key: "footer_address" },
      create: { key: "footer_address", value: address || "" },
      update: { value: address || "" },
    });

    await db.setting.upsert({
      where: { key: "footer_email" },
      create: { key: "footer_email", value: email || "" },
      update: { value: email || "" },
    });

    await db.setting.upsert({
      where: { key: "footer_phone" },
      create: { key: "footer_phone", value: phone || "" },
      update: { value: phone || "" },
    });

    return successResponse({ success: true });
  } catch {
    return errorResponse("Impossible d'enregistrer la configuration du pied de page", 500);
  }
}
