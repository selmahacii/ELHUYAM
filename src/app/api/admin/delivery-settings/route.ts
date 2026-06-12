import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, saveZRSettings, zrTestConnection } from "@/lib/zrexpress";
import { z } from "zod";

const settingsSchema = z.object({
  secretKey: z.string().min(1, "Secret key is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const settings = await getZRSettings();
    if (!settings) return successResponse({ configured: false, secretKey: "", tenantId: "" });

    // Mask the secret key — show only last 8 chars
    const maskedKey = settings.secretKey.length > 8
      ? "•".repeat(settings.secretKey.length - 8) + settings.secretKey.slice(-8)
      : settings.secretKey;

    return successResponse({ configured: true, secretKey: maskedKey, tenantId: settings.tenantId });
  } catch {
    return errorResponse("Failed to load settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    console.log("[ZR Settings API] Received update request for delivery settings");

    // Clean up inputs by trimming spaces/newlines from copy-paste
    if (body && typeof body === "object") {
      if (typeof body.secretKey === "string") body.secretKey = body.secretKey.trim();
      if (typeof body.tenantId === "string") body.tenantId = body.tenantId.trim();
    }
    
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[ZR Settings API] Safe parse validation failed:", parsed.error.errors);
      return errorResponse(parsed.error.errors[0].message);
    }

    let { secretKey, tenantId } = parsed.data;

    // "__KEEP__" is a sentinel sent from the UI when testing without changing the key
    if (secretKey === "__KEEP__") {
      console.log("[ZR Settings API] Using sentinel '__KEEP__'. Fetching existing secretKey from db");
      const existing = await getZRSettings();
      if (!existing) {
        console.warn("[ZR Settings API] Failed: no existing settings in database to test");
        return errorResponse("No stored credentials to test");
      }
      secretKey = existing.secretKey;
    }

    const maskedKey = secretKey.length > 8
      ? secretKey.slice(0, 4) + "..." + secretKey.slice(-4)
      : "****";
    console.log(`[ZR Settings API] Saving settings: Tenant ID="${tenantId}" | Secret Key="${maskedKey}"`);
    await saveZRSettings({ secretKey, tenantId });

    // Test the connection with the new credentials
    console.log("[ZR Settings API] Testing connection with new/saved credentials...");
    const connected = await zrTestConnection({ secretKey, tenantId });
    console.log(`[ZR Settings API] Connection test result: ${connected ? "CONNECTED ✓" : "FAILED ✗"}`);

    return successResponse({ configured: true, connected });
  } catch (error) {
    console.error("[ZR Settings API] Unexpected error in PUT delivery-settings:", error);
    return errorResponse("Failed to save settings", 500);
  }
}
