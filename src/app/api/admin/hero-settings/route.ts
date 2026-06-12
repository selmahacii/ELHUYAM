import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const heroSchema = z.object({
  desktopMedia: z.string().min(1, "Desktop media is required"),
  mobileMedia: z.string().min(1, "Mobile media is required"),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const desktopSetting = await db.setting.findUnique({ where: { key: "hero_desktop_media" } });
    const mobileSetting = await db.setting.findUnique({ where: { key: "hero_mobile_media" } });

    return successResponse({
      desktopMedia: desktopSetting?.value || "/hero-mobile.png",
      mobileMedia: mobileSetting?.value || "/IMG_2121.MOV",
    });
  } catch {
    return errorResponse("Failed to load hero settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = heroSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { desktopMedia, mobileMedia } = parsed.data;

    await db.setting.upsert({
      where: { key: "hero_desktop_media" },
      create: { key: "hero_desktop_media", value: desktopMedia },
      update: { value: desktopMedia },
    });

    await db.setting.upsert({
      where: { key: "hero_mobile_media" },
      create: { key: "hero_mobile_media", value: mobileMedia },
      update: { value: mobileMedia },
    });

    return successResponse({ success: true });
  } catch {
    return errorResponse("Failed to save hero settings", 500);
  }
}
