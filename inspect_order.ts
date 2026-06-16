import { db } from "./src/lib/db";
import { getZRSettings, zrCreateParcel, toUUID } from "./src/lib/zrexpress";

const ZR_BASE = "https://api.zrexpress.app";
const ZR_VERSION = "1";

async function zrFetch(settings: any, path: string, options: any = {}) {
  const url = `${ZR_BASE}/api/v${ZR_VERSION}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": settings.secretKey,
      "X-Tenant": settings.tenantId,
      ...(options.headers || {}),
    },
  });
  return { status: res.status, statusText: res.statusText, text: await res.text() };
}

async function run() {
  const settings = await getZRSettings();
  if (!settings) return;

  const payload = {
    customer: {
      customerId: "796b80a5-2c1b-3599-e8ee-3379834ee65f",
      name: "selma haci",
      phone: { number1: "+213780125700" }
    },
    deliveryAddress: {
      street: "kouba",
      cityTerritoryId: "981f136a-996f-463e-a536-8e643daab193",
      districtTerritoryId: "0693b196-8177-4b0a-b6cf-0951f7531177"
    },
    deliveryType: "pickup-point",
    hubId: "a53e622e-f201-4ea9-a443-b2c1682fadc3",
    amount: 0,
    description: "abaya zineb  (x8)",
    orderedProducts: [
      {
        unitPrice: 3200,
        quantity: 8,
        productName: "abaya zineb ",
        stockType: "none"
      }
    ],
    externalId: "ELH-MQGSHSBN-A10K"
  };

  const res = await zrFetch(settings, "/parcels", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status, res.statusText);
  console.log("Response Body:", res.text);
}

run()
  .catch(e => console.error(e))
  .finally(() => db.$disconnect());
