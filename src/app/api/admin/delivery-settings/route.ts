import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, saveZRSettings, zrTestConnection } from "@/lib/zrexpress";
import { getInternationalOrdersEnabled, setInternationalOrdersEnabled } from "@/lib/settings";
import { z } from "zod";

const settingsSchema = z.object({
  secretKey: z.string().min(1, "Secret key is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  internationalOrdersEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const [settings, internationalOrdersEnabled] = await Promise.all([
      getZRSettings(),
      getInternationalOrdersEnabled(),
    ]);

    if (!settings) {
      return successResponse({
        configured: false,
        secretKey: "",
        tenantId: "",
        internationalOrdersEnabled,
      });
    }

    // Mask the secret key — show only last 8 chars
    const maskedKey = settings.secretKey.length > 8
      ? "•".repeat(settings.secretKey.length - 8) + settings.secretKey.slice(-8)
      : settings.secretKey;

    return successResponse({
      configured: true,
      secretKey: maskedKey,
      tenantId: settings.tenantId,
      internationalOrdersEnabled,
    });
  } catch {
    return errorResponse("Failed to load settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();

    // Clean up inputs by trimming spaces/newlines from copy-paste
    if (body && typeof body === "object") {
      if (typeof body.secretKey === "string") body.secretKey = body.secretKey.trim();
      if (typeof body.tenantId === "string") body.tenantId = body.tenantId.trim();
    }
    
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    let { secretKey, tenantId, internationalOrdersEnabled } = parsed.data;

    if (typeof internationalOrdersEnabled === "boolean") {
      await setInternationalOrdersEnabled(internationalOrdersEnabled);
    }

    // "__KEEP__" is a sentinel sent from the UI when testing without changing the key
    if (secretKey === "__KEEP__") {
      const existing = await getZRSettings();
      if (!existing) {
        return errorResponse("No stored credentials to test");
      }
      secretKey = existing.secretKey;
    }

    await saveZRSettings({ secretKey, tenantId });

    // Test the connection with credentials
    const testResult = await zrTestConnection({ secretKey, tenantId });

    return successResponse({ 
      configured: true, 
      connected: testResult.ok,
      internationalOrdersEnabled: await getInternationalOrdersEnabled(),
      errorDetails: testResult.ok ? null : {
        status: testResult.status,
        error: testResult.error,
        rawBody: testResult.rawBody
      }
    });
  } catch (error) {
    console.error("[ZR Settings API] Unexpected error in PUT delivery-settings:", error);
    return errorResponse("Failed to save settings", 500);
  }
}
