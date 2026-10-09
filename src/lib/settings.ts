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
  { revalidate: 86400, tags: ["settings"] }
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

const getCachedExchangeRate = unstable_cache(
  async () => {
    try {
      const setting = await db.setting.findUnique({
        where: { key: "eur_exchange_rate" },
      });
      if (!setting) return 270;
      const parsed = parseFloat(setting.value);
      return isNaN(parsed) || parsed <= 0 ? 270 : parsed;
    } catch (error) {
      console.error("Failed to read eur_exchange_rate setting:", error);
      return 270;
    }
  },
  ["eur_exchange_rate"],
  { revalidate: 3600, tags: ["settings"] }
);

export async function getEurExchangeRate(): Promise<number> {
  return getCachedExchangeRate();
}

export async function setEurExchangeRate(rate: number): Promise<void> {
  await db.setting.upsert({
    where: { key: "eur_exchange_rate" },
    update: { value: rate.toString() },
    create: {
      key: "eur_exchange_rate",
      value: rate.toString(),
    },
  });
  revalidateTag("settings", "default");
}
