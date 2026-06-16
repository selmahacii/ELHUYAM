import { db } from "./src/lib/db";
import { getZRSettings } from "./src/lib/zrexpress";

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
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, data: await res.json() };
}

async function run() {
  const settings = await getZRSettings();
  if (!settings) return;

  const payloads = [
    { pageNumber: 1, pageSize: 5, sort: "-createdAt" },
    { pageNumber: 1, pageSize: 5, sortField: "createdAt", sortOrder: "desc" },
    { pageNumber: 1, pageSize: 5, sortField: "createdAt", sortOrder: "descending" },
    { pageNumber: 1, pageSize: 5, order: "desc", sort: "createdAt" },
    { pageNumber: 1, pageSize: 5, sortOrder: "desc", sortBy: "createdAt" },
    { pageNumber: 1, pageSize: 5, sortOrder: "asc", sortBy: "createdAt" }
  ];

  for (const p of payloads) {
    console.log("Testing:", JSON.stringify(p));
    const res = await zrFetch(settings, "/parcels/search", {
      method: "POST",
      body: JSON.stringify(p)
    });
    if (res.ok && res.data?.items?.[0]) {
      console.log(`First item ID: ${res.data.items[0].id} | tracking: ${res.data.items[0].trackingNumber} | createdAt: ${res.data.items[0].createdAt}`);
    } else {
      console.log("Failed or no items", res.status);
    }
    console.log("-".repeat(50));
  }
}

run()
  .catch(e => console.error(e))
  .finally(() => db.$disconnect());
