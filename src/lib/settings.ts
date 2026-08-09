import { db } from "@/lib/db";

export async function getInternationalOrdersEnabled(): Promise<boolean> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: "international_orders_enabled" },
    });
    if (!setting) return true; // Default to true if not configured yet
    return setting.value === "true";
  } catch (error) {
    console.error("Failed to read international_orders_enabled setting:", error);
    return true;
  }
}

export async function setInternationalOrdersEnabled(enabled: boolean): Promise<void> {
  await db.setting.upsert({
    where: { key: "international_orders_enabled" },
    update: { value: enabled ? "true" : "false" },
    create: {
      key: "international_orders_enabled",
      value: enabled ? "true" : "false",
    },
  });
}
