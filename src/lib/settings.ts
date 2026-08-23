import { db } from "@/lib/db";

import { unstable_cache, revalidateTag } from "next/cache";

const getCachedSetting = unstable_cache(
  async () => {
    try {
      const setting = await db.setting.findUnique({
        where: { key: "international_orders_enabled" },
      });
      if (!setting) return true;
      return setting.value === "true";
    } catch (error) {
      console.error("Failed to read international_orders_enabled setting:", error);
      return true;
    }
  },
  ["international_orders_enabled"],
  { revalidate: 300, tags: ["settings"] }
);

export async function getInternationalOrdersEnabled(): Promise<boolean> {
  return getCachedSetting();
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
  revalidateTag("settings", "default");
}
