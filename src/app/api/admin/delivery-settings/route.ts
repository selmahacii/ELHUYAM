import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, saveZRSettings, zrTestConnection } from "@/lib/zrexpress";
import {
  getInternationalOrdersEnabled,
  setInternationalOrdersEnabled,
  getEurExchangeRate,
  setEurExchangeRate,
} from "@/lib/settings";
import { z } from "zod";

const settingsSchema = z.object({
  secretKey: z.string().optional(),
  tenantId: z.string().optional(),
  internationalOrdersEnabled: z.boolean().optional(),
  eurExchangeRate: z.coerce.number().positive("Le taux de change doit être supérieur à 0").optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const [settings, internationalOrdersEnabled, eurExchangeRate] = await Promise.all([
      getZRSettings(),
      getInternationalOrdersEnabled(),
      getEurExchangeRate(),
    ]);

    const maskedKey = settings?.secretKey
      ? settings.secretKey.length > 8
        ? "•".repeat(settings.secretKey.length - 8) + settings.secretKey.slice(-8)
        : settings.secretKey
      : "";

    return successResponse({
      configured: !!settings,
      secretKey: maskedKey,
      tenantId: settings?.tenantId ?? "",
      internationalOrdersEnabled,
      eurExchangeRate,
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

    let { secretKey, tenantId, internationalOrdersEnabled, eurExchangeRate } = parsed.data;

    if (typeof internationalOrdersEnabled === "boolean") {
      await setInternationalOrdersEnabled(internationalOrdersEnabled);
    }

    if (typeof eurExchangeRate === "number" && eurExchangeRate > 0) {
      await setEurExchangeRate(eurExchangeRate);
    }

    let connected: boolean | null = null;
    let errorDetails: any = null;

    // Only update ZR settings if secretKey and tenantId are provided
    if (secretKey && tenantId) {
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
      connected = testResult.ok;
      if (!testResult.ok) {
        errorDetails = {
          status: testResult.status,
          error: testResult.error,
          rawBody: testResult.rawBody,
        };
      }
    }

    const [updatedIntl, updatedRate, updatedSettings] = await Promise.all([
      getInternationalOrdersEnabled(),
      getEurExchangeRate(),
      getZRSettings(),
    ]);

    return successResponse({ 
      configured: !!updatedSettings, 
      connected,
      internationalOrdersEnabled: updatedIntl,
      eurExchangeRate: updatedRate,
      errorDetails,
    });
  } catch (error) {
    console.error("[Settings API] Unexpected error in PUT delivery-settings:", error);
    return errorResponse("Failed to save settings", 500);
  }
}
