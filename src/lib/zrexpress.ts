import { db } from "@/lib/db";

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

export async function getZRSettings(): Promise<ZRSettings | null> {
  const rows = await db.setting.findMany({
    where: { key: { in: ["zr_secret_key", "zr_tenant_id"] } },
  });
  const map = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  if (!map.zr_secret_key || !map.zr_tenant_id) return null;
  return { secretKey: String(map.zr_secret_key).trim(), tenantId: String(map.zr_tenant_id).trim() };
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

export async function resolveZRTerritoryIds(
  settings: ZRSettings,
  wilayaName: string,
  wilayaCode: string,
  city?: string | null,
  street?: string | null
): Promise<{ cityTerritoryId: string; districtTerritoryId: string }> {
  const candidates: string[] = [];

  // Extract commune candidates from freeform city/street strings
  if (city && city.trim()) {
    const parts = city.split(/[,/;–-]+/).map((p) => p.trim()).filter((p) => p.length >= 3);
    candidates.push(...parts);
  }

  if (street && street.trim()) {
    const parts = street.split(/[,/;–-]+/).map((p) => p.trim()).filter((p) => p.length >= 3);
    candidates.push(...parts);
  }

  if (wilayaName && !candidates.includes(wilayaName)) {
    candidates.push(wilayaName);
  }

  if (wilayaCode && !candidates.includes(wilayaCode)) {
    candidates.push(wilayaCode);
  }

  // Try each candidate query
  for (const query of candidates) {
    try {
      const res = await zrSearchTerritories(settings, query);
      if (res.ok && res.data?.items?.length > 0) {
        const item = res.data.items[0];
        const cityId = item.cityTerritoryId || item.id;
        const districtId = item.id || item.districtTerritoryId || cityId;
        if (cityId && districtId) {
          return { cityTerritoryId: cityId, districtTerritoryId: districtId };
        }
      }
    } catch {
      // continue candidate loop
    }
  }

  // Fallback to searching Wilaya Name directly
  try {
    const res = await zrSearchTerritories(settings, wilayaName);
    if (res.ok && res.data?.items?.length > 0) {
      const item = res.data.items[0];
      const cityId = item.cityTerritoryId || item.id;
      const districtId = item.id || item.districtTerritoryId || cityId;
      if (cityId && districtId) {
        return { cityTerritoryId: cityId, districtTerritoryId: districtId };
      }
    }
  } catch {}

  // Ultimate fallback to Alger
  try {
    const res = await zrSearchTerritories(settings, "Alger");
    if (res.ok && res.data?.items?.length > 0) {
      const item = res.data.items[0];
      return {
        cityTerritoryId: item.cityTerritoryId || item.id,
        districtTerritoryId: item.id || item.districtTerritoryId,
      };
    }
  } catch {}

  return {
    cityTerritoryId: "53c9e062-9c4e-4c77-8b71-55eabf887f83",
    districtTerritoryId: "8d0b6cd9-7712-47d2-9ea4-460246494c32",
  };
}
