import { db } from "@/lib/db";
import { BUREAUX } from "@/lib/bureaux";
import { getWilayaByCode } from "@/lib/wilayas";

const ZR_BASE = "https://api.zrexpress.app";
const ZR_VERSION = "1";

export interface ZRSettings {
  secretKey: string;
  tenantId: string;
}

export interface ZRParcel {
  id: string;
  trackingNumber: string;
  status?: string;
  stateName?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  wilaya?: string;
  amount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZRStateHistory {
  id: string;
  stateName: string;
  stateDate: string;
  note?: string;
  agentName?: string;
}

// ── Settings helpers ──────────────────────────────────────────────────────────

let cachedSettings: { settings: ZRSettings | null; timestamp: number } | null = null;

export async function getZRSettings(): Promise<ZRSettings | null> {
  const now = Date.now();
  if (cachedSettings && now - cachedSettings.timestamp < 60000) {
    return cachedSettings.settings;
  }

  const rows = await db.setting.findMany({
    where: { key: { in: ["zr_secret_key", "zr_tenant_id"] } },
  });
  const map = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  const secretKey = map.zr_secret_key ? String(map.zr_secret_key).trim() : process.env.ZR_EXPRESS_SECRET_KEY?.trim();
  const tenantId = map.zr_tenant_id ? String(map.zr_tenant_id).trim() : process.env.ZR_EXPRESS_TENANT_ID?.trim();

  if (!secretKey || !tenantId) {
    cachedSettings = { settings: null, timestamp: now };
    return null;
  }

  const settings = { secretKey, tenantId };
  cachedSettings = { settings, timestamp: now };
  return settings;
}

export async function saveZRSettings(settings: ZRSettings): Promise<void> {
  const secretKey = settings.secretKey.trim();
  const tenantId = settings.tenantId.trim();
  await Promise.all([
    db.setting.upsert({
      where: { key: "zr_secret_key" },
      create: { key: "zr_secret_key", value: secretKey },
      update: { value: secretKey },
    }),
    db.setting.upsert({
      where: { key: "zr_tenant_id" },
      create: { key: "zr_tenant_id", value: tenantId },
      update: { value: tenantId },
    }),
  ]);
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function zrFetch<T>(
  settings: ZRSettings,
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string; status?: number; rawBody?: string }> {
  const url = `${ZR_BASE}/api/v${ZR_VERSION}${path}`;
  
  // Mask secret key for safe console logs
  const maskedKey = settings.secretKey
    ? (settings.secretKey.length > 8
        ? `${settings.secretKey.slice(0, 4)}...${settings.secretKey.slice(-4)}`
        : "****")
    : "missing";
  
  console.log(`[ZR Express API Request] Method: ${options.method ?? "GET"} | URL: ${url}`);
  console.log(`[ZR Express API Request] Headers: X-Tenant-Id="${settings.tenantId}" | Authorization="Bearer ${maskedKey}"`);
  if (options.body) {
    console.log(`[ZR Express API Request] Payload:`, options.body);
  }

  const isJwt = settings.secretKey.startsWith("eyJ");
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant": settings.tenantId,
    "X-Api-Key": settings.secretKey,
    "X-Tenant-Id": settings.tenantId,
  };
  if (isJwt) {
    defaultHeaders["Authorization"] = `Bearer ${settings.secretKey}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string> | undefined),
      },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    console.log(`[ZR Express API Response] Status: ${res.status} ${res.statusText}`);
    console.log(`[ZR Express API Response] Raw Body:`, text);

    let json: unknown;
    try { json = JSON.parse(text); } catch { json = { message: text }; }

    if (!res.ok) {
      let errStr = "";
      if (json && typeof json === "object") {
        const j = json as Record<string, any>;
        if (Array.isArray(j.errors)) {
          errStr = j.errors.map((e: any) => typeof e === "string" ? e : (e.description || e.message || JSON.stringify(e))).join(" | ");
        } else if (j.errors && typeof j.errors === "object") {
          const errList: string[] = [];
          for (const [key, val] of Object.entries(j.errors)) {
            if (Array.isArray(val)) errList.push(`${key}: ${val.join(", ")}`);
            else if (typeof val === "string") errList.push(`${key}: ${val}`);
          }
          if (errList.length > 0) errStr = errList.join(" | ");
        }
        if (!errStr && typeof j.detail === "string" && j.detail) errStr = j.detail;
        if (!errStr && typeof j.message === "string" && j.message) errStr = j.message;
        if (!errStr && typeof j.error === "string" && j.error) errStr = j.error;
        if (!errStr && typeof j.title === "string" && j.title) errStr = j.title;
      }
      if (!errStr && text) {
        errStr = text.length > 300 ? text.slice(0, 300) + "..." : text;
      }
      const finalErr = errStr || `HTTP ${res.status}`;
      console.error(`[ZR Express API Error] Failed with message:`, finalErr);
      return { ok: false, error: finalErr, status: res.status, rawBody: text };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    console.error(`[ZR Express API Exception] Network or runtime error:`, e);
    return { ok: false, error: e instanceof Error ? e.message : "Network error", status: 500 };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function zrGetParcelByTracking(
  settings: ZRSettings,
  trackingNumber: string
): Promise<{ ok: boolean; data?: ZRParcel; error?: string }> {
  return zrFetch<ZRParcel>(settings, `/parcels/${encodeURIComponent(trackingNumber)}`);
}

export async function zrGetStateHistory(
  settings: ZRSettings,
  parcelId: string
): Promise<{ ok: boolean; data?: ZRStateHistory[]; error?: string }> {
  return zrFetch<ZRStateHistory[]>(settings, `/parcels/${encodeURIComponent(parcelId)}/state-history`);
}

export async function zrCreateParcel(
  settings: ZRSettings,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: ZRParcel; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<ZRParcel>(settings, "/parcels", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ZRBulkParcelsResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  successes: Array<{
    index: number;
    parcelId: string;
    trackingNumber?: string | null;
    externalId?: string | null;
  }>;
  failures: Array<{
    index: number;
    errorCode?: string | null;
    errorMessage?: string | null;
    externalId?: string | null;
  }>;
}

export async function zrCreateBulkParcels(
  settings: ZRSettings,
  parcels: Array<Record<string, unknown>>
): Promise<{ ok: boolean; data?: ZRBulkParcelsResponse; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<ZRBulkParcelsResponse>(settings, "/parcels/bulk", {
    method: "POST",
    body: JSON.stringify({ parcels }),
  });
}

export async function zrCreateBulkRefundParcels(
  settings: ZRSettings,
  parcels: Array<Record<string, unknown>>
): Promise<{ ok: boolean; data?: ZRBulkParcelsResponse; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<ZRBulkParcelsResponse>(settings, "/parcels/bulk-refund", {
    method: "POST",
    body: JSON.stringify({ parcels }),
  });
}

export interface ZRUpdateParcelStatePayload {
  parcelId: string;
  newStateId: string;
  deliveryPersonId?: string | null;
  arrivalHubId?: string | null;
  comment?: string | null;
}

export interface ZRUpdateParcelStateResponse {
  parcelId: string;
  newStateId: string;
  newStateName?: string | null;
  trackingNumber?: string | null;
}

export async function zrUpdateParcelState(
  settings: ZRSettings,
  parcelId: string,
  payload: ZRUpdateParcelStatePayload
): Promise<{ ok: boolean; data?: ZRUpdateParcelStateResponse; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<ZRUpdateParcelStateResponse>(settings, `/parcels/${encodeURIComponent(parcelId)}/state`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface ZRUpdateDeliveryAddressPayload {
  parcelId: string;
  deliveryAddress?: {
    cityTerritoryId: string;
    districtTerritoryId: string;
    street?: string | null;
  };
  hubId?: string | null;
}

export async function zrUpdateDeliveryAddress(
  settings: ZRSettings,
  id: string,
  payload: ZRUpdateDeliveryAddressPayload
): Promise<{ ok: boolean; data?: { id?: string | null }; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<{ id?: string | null }>(settings, `/parcels/${encodeURIComponent(id)}/deliveryAddress`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function zrTestConnection(settings: ZRSettings): Promise<{ ok: boolean; status?: number; error?: string; rawBody?: string }> {
  console.log(`[ZR Express Connection Test] Initiating connection test...`);
  const res = await zrFetch(settings, "/users/profile");
  console.log(`[ZR Express Connection Test] Completed. Status: ${res.ok ? "SUCCESS ✓" : "FAILED ✗"}`);
  if (!res.ok) {
    console.error(`[ZR Express Connection Test] Error description: ${res.error}`);
  }
  return {
    ok: res.ok,
    status: res.status,
    error: res.error,
    rawBody: res.rawBody
  };
}

// ── Catalog & Stock Management API ────────────────────────────────────────────

export interface ZRProductPayload {
  id?: string;
  name: string;
  categoryId: string;
  subCategoryId: string;
  basePrice: number;
  purchasePrice?: number;
  length: number;
  width: number;
  height: number;
  weight?: number;
  localStock: number;
  sku?: string;
}

export async function zrCreateProduct(
  settings: ZRSettings,
  payload: ZRProductPayload
): Promise<{ ok: boolean; data?: { id: string }; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<{ id: string }>(settings, "/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function zrUpdateProduct(
  settings: ZRSettings,
  id: string,
  payload: Partial<ZRProductPayload> & { id: string }
): Promise<{ ok: boolean; data?: { id: string }; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<{ id: string }>(settings, `/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function zrCreateStockMovement(
  settings: ZRSettings,
  products: Array<{ productId: string; quantity: number }>,
  hubStockId?: string
): Promise<{ ok: boolean; data?: { id: string }; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<{ id: string }>(settings, "/stock-movements/product/warehouse-stock/user", {
    method: "POST",
    body: JSON.stringify({ products, hubStockId }),
  });
}

// ── Customers API ─────────────────────────────────────────────────────────────

export interface ZRCustomerPayload {
  name: string;
  phone: {
    number1: string;
    number2?: string;
    number3?: string;
  };
  timeSlot?: "morning" | "afternoon" | "evening";
  instruction?: string;
  deliveryPreference?: "home" | "pickup-point";
  addresses?: Array<{
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
    cityTerritoryId?: string;
    districtTerritoryId?: string;
    isPrimary?: boolean;
  }>;
}

export async function zrCreateIndividualCustomer(
  settings: ZRSettings,
  payload: ZRCustomerPayload
): Promise<{ ok: boolean; data?: { id: string }; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<{ id: string }>(settings, "/customers/individual", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function zrSearchCustomers(
  settings: ZRSettings,
  keyword?: string,
  pageNumber = 1,
  pageSize = 10
): Promise<{ ok: boolean; data?: any; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<any>(settings, "/customers/search", {
    method: "POST",
    body: JSON.stringify({
      keyword,
      pageNumber,
      pageSize,
      includePrimaryAddressOnly: true,
    }),
  });
}

export async function zrSearchTerritories(
  settings: ZRSettings,
  keyword?: string
): Promise<{ ok: boolean; data?: any; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<any>(settings, "/territories/search", {
    method: "POST",
    body: JSON.stringify({
      keyword,
      pageSize: 50,
      pageNumber: 1,
    }),
  });
}

function extractTerritoryPair(items: any[]): { cityTerritoryId: string; districtTerritoryId: string } | null {
  if (!Array.isArray(items) || items.length === 0) return null;

  // 1. Preference 1: District item with explicit cityTerritoryId that differs from its own ID
  for (const item of items) {
    const cityId = item.cityTerritoryId || item.parentTerritoryId || item.parentId || item.cityId;
    const distId = item.id || item.districtTerritoryId;
    if (cityId && distId && cityId !== distId) {
      return { cityTerritoryId: cityId, districtTerritoryId: distId };
    }
  }

  // 2. Preference 2: A parent city item and a child district item
  const cityItem = items.find((i) => !i.cityTerritoryId || i.cityTerritoryId === i.id || i.type === "city" || i.isCity);
  const districtItem = items.find((i) => i.id && i.id !== cityItem?.id);

  if (cityItem?.id && districtItem?.id && cityItem.id !== districtItem.id) {
    return { cityTerritoryId: cityItem.id, districtTerritoryId: districtItem.id };
  }

  // 3. Preference 3: If 2 distinct items exist
  if (items.length >= 2 && items[0]?.id && items[1]?.id && items[0].id !== items[1].id) {
    return { cityTerritoryId: items[0].id, districtTerritoryId: items[1].id };
  }

  return null;
}

const territoryCache = new Map<string, { cityTerritoryId: string; districtTerritoryId: string }>();

export async function resolveZRTerritoryIds(
  settings: ZRSettings,
  wilayaName: string,
  wilayaCode: string,
  city?: string | null,
  street?: string | null
): Promise<{ cityTerritoryId: string; districtTerritoryId: string }> {
  const cacheKey = `${wilayaCode}_${wilayaName}_${city ?? ""}_${street ?? ""}`;
  if (territoryCache.has(cacheKey)) {
    return territoryCache.get(cacheKey)!;
  }

  const candidatesSet = new Set<string>();

  const cleanWord = (s: string) =>
    s
      .replace(/hub|bureau|مكتب|–|-|\d+/gi, " ")
      .trim();

  if (street && street.trim()) {
    const cleanSt = cleanWord(street);
    if (cleanSt.length >= 3) candidatesSet.add(cleanSt);
  }

  if (city && city.trim()) {
    const cleanCi = cleanWord(city);
    if (cleanCi.length >= 3) candidatesSet.add(cleanCi);
  }

  if (wilayaName && wilayaName.trim()) {
    candidatesSet.add(wilayaName.trim());
  }

  // Filter out numeric strings so numbers like "16" don't match Adrar or random territories
  const candidates = Array.from(candidatesSet).filter((c) => !/^\d+$/.test(c));

  // Try each candidate query
  for (const query of candidates) {
    try {
      const res = await zrSearchTerritories(settings, query);
      if (res.ok && Array.isArray(res.data?.items)) {
        const pair = extractTerritoryPair(res.data.items);
        if (pair) {
          territoryCache.set(cacheKey, pair);
          return pair;
        }
      }
    } catch {
      // continue candidate loop
    }
  }

  // Fallback to searching Wilaya Name directly (e.g. "Alger")
  if (wilayaName) {
    try {
      const res = await zrSearchTerritories(settings, wilayaName.trim());
      if (res.ok && Array.isArray(res.data?.items)) {
        const pair = extractTerritoryPair(res.data.items);
        if (pair) {
          territoryCache.set(cacheKey, pair);
          return pair;
        }
      }
    } catch {}
  }

  // Ultimate fallback to Alger
  try {
    const res = await zrSearchTerritories(settings, "Alger");
    if (res.ok && Array.isArray(res.data?.items)) {
      const pair = extractTerritoryPair(res.data.items);
      if (pair) {
        territoryCache.set(cacheKey, pair);
        return pair;
      }
    }
  } catch {}

  const fallback = {
    cityTerritoryId: "53c9e062-9c4e-4c77-8b71-55eabf887f83",
    districtTerritoryId: "8d0b6cd9-7712-47d2-9ea4-460246494c32",
  };
  territoryCache.set(cacheKey, fallback);
  return fallback;
}

export async function zrSearchHubs(
  settings: ZRSettings,
  keyword?: string
): Promise<{ ok: boolean; data?: any; error?: string; status?: number; rawBody?: string }> {
  return zrFetch<any>(settings, "/hubs/search", {
    method: "POST",
    body: JSON.stringify({
      keyword,
      pageSize: 50,
      pageNumber: 1,
    }),
  });
}

export async function zrGetAllHubs(
  settings: ZRSettings
): Promise<{ ok: boolean; data?: any; error?: string; status?: number; rawBody?: string }> {
  const searchRes = await zrSearchHubs(settings, "");
  if (searchRes.ok && Array.isArray(searchRes.data?.items) && searchRes.data.items.length > 0) {
    return searchRes;
  }
  return zrFetch<any>(settings, "/hubs");
}

const hubCache = new Map<string, string>();

export async function resolveZRHubId(
  settings: ZRSettings,
  wilayaName: string,
  wilayaCode: string,
  city?: string | null,
  street?: string | null
): Promise<string | null> {
  const cacheKey = `${wilayaCode}_${wilayaName}_${city ?? ""}_${street ?? ""}`;
  if (hubCache.has(cacheKey)) {
    return hubCache.get(cacheKey)!;
  }

  // 1. Try to match bureau from local database
  const fullSearchStr = `${street ?? ""} ${city ?? ""}`;
  const localBureau = BUREAUX.find(
    (b) => fullSearchStr.toLowerCase().includes(b.name.toLowerCase()) || (street && street.toLowerCase().includes((b.commune || b.city).toLowerCase()))
  );

  const targetCommune = localBureau?.commune || city || "";
  const targetWilayaName = localBureau ? getWilayaByCode(localBureau.wilayaCode)?.name || wilayaName : wilayaName;
  const targetWilayaCode = localBureau?.wilayaCode || wilayaCode;

  const candidateQueries = [
    targetCommune,
    street ? street.replace(/hub|bureau|مكتب|\d+/gi, "").trim() : "",
    targetWilayaName,
  ].filter((c) => c && c.length >= 3 && !/^\d+$/.test(c));

  // 2. Search ZR Express hubs with specific candidate queries
  for (const query of candidateQueries) {
    try {
      const res = await zrSearchHubs(settings, query);
      const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
      if (res.ok && Array.isArray(items) && items.length > 0) {
        const bestHub = items.find((h: any) => {
          const hName = (h.name || h.hubName || h.address || "").toLowerCase();
          const hCode = String(h.wilayaCode || h.code || "");
          return (
            hName.includes(query.toLowerCase()) ||
            hCode === targetWilayaCode ||
            (targetWilayaName && hName.includes(targetWilayaName.toLowerCase()))
          );
        }) || items[0];

        const foundId = bestHub?.id || bestHub?.hubId;
        if (foundId) {
          hubCache.set(cacheKey, foundId);
          return foundId;
        }
      }
    } catch {}
  }

  // 3. Fetch all hubs for tenant and strictly filter by Wilaya Code or Wilaya Name
  try {
    const allRes = await zrGetAllHubs(settings);
    const items = allRes.data?.items || (Array.isArray(allRes.data) ? allRes.data : []);
    if (Array.isArray(items) && items.length > 0) {
      const matched = items.find((item: any) => {
        const name = (item.name || item.hubName || item.city || "").toLowerCase();
        const code = String(item.wilayaCode || item.code || "");
        return (
          code === targetWilayaCode ||
          (targetWilayaName && name.includes(targetWilayaName.toLowerCase())) ||
          (targetCommune && name.includes(targetCommune.toLowerCase()))
        );
      });

      if (matched?.id || matched?.hubId) {
        const foundId = matched.id || matched.hubId;
        hubCache.set(cacheKey, foundId);
        return foundId;
      }
    }
  } catch {}

  return null;
}
