import { db } from "@/lib/db";
import crypto from "crypto";


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

export interface ZRPhone {
  number1?: string;
  number2?: string;
  number3?: string;
}

export interface ZRCoordinates {
  lat?: number;
  lng?: number;
}

export interface ZRAddress {
  id?: string;
  street?: string;
  city?: string;
  cityTerritoryId?: string;
  district?: string;
  districtTerritoryId?: string;
  postalCode?: string;
  country?: string;
  isPrimary?: boolean;
  coordinates?: ZRCoordinates;
}

export interface ZRCustomer {
  id?: string;
  name?: string;
  phone?: ZRPhone;
  dateOfBirth?: string;
  instruction?: string;
  timeSlot?: string;
  deliveryPreference?: string;
  companyId?: string;
  companyContactPerson?: string;
  addresses?: ZRAddress[];
}

export interface ZRPagedCustomerResponse {
  items?: ZRCustomer[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface ZRProductCreatePayload {
  name?: string;
  localStock?: number;
  sku?: string;
  categoryId?: string;
  subCategoryId?: string;
  basePrice?: number;
  purchasePrice?: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
}

export interface ZRProductUpdatePayload extends ZRProductCreatePayload {
  id?: string;
}

// ── Settings helpers ──────────────────────────────────────────────────────────

export async function getZRSettings(): Promise<ZRSettings | null> {
  const rows = await db.setting.findMany({
    where: { key: { in: ["zr_secret_key", "zr_tenant_id"] } },
  });
  const map = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  if (!map.zr_secret_key || !map.zr_tenant_id) return null;
  return { secretKey: map.zr_secret_key, tenantId: map.zr_tenant_id };
}

export async function saveZRSettings(settings: ZRSettings): Promise<void> {
  await Promise.all([
    db.setting.upsert({
      where: { key: "zr_secret_key" },
      create: { key: "zr_secret_key", value: settings.secretKey },
      update: { value: settings.secretKey },
    }),
    db.setting.upsert({
      where: { key: "zr_tenant_id" },
      create: { key: "zr_tenant_id", value: settings.tenantId },
      update: { value: settings.tenantId },
    }),
  ]);
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function zrFetch<T>(
  settings: ZRSettings,
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const url = `${ZR_BASE}/api/v${ZR_VERSION}${path}`;
  
  // Mask secret key for safe console logs
  const maskedKey = settings.secretKey
    ? (settings.secretKey.length > 8
        ? `${settings.secretKey.slice(0, 4)}...${settings.secretKey.slice(-4)}`
        : "****")
    : "missing";
  
  console.log(`[ZR Express API Request] Method: ${options.method ?? "GET"} | URL: ${url}`);
  console.log(`[ZR Express API Request] Headers: X-Tenant="${settings.tenantId}" | X-Api-Key="${maskedKey}"`);
  if (options.body) {
    console.log(`[ZR Express API Request] Payload:`, options.body);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": settings.secretKey,
        "X-Tenant": settings.tenantId,
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
      const errObj = json as any;
      let errStr = errObj?.message || errObj?.detail;
      if (errObj?.errors && Array.isArray(errObj.errors)) {
        errStr = errObj.errors.map((e: any) => e.description || e.message).join(" | ");
      }
      console.error(`[ZR Express API Error] Failed with message:`, errStr ?? `HTTP ${res.status}`);
      return { ok: false, error: errStr ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    console.error(`[ZR Express API Exception] Network or runtime error:`, e);
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
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

let cachedTerritories: any[] | null = null;

async function fetchAllTerritories(settings: ZRSettings): Promise<any[]> {
  if (cachedTerritories) return cachedTerritories;
  let allItems: any[] = [];
  let page = 1;
  while (true) {
    const res = await zrFetch<any>(settings, "/territories/search", {
      method: "POST",
      body: JSON.stringify({ pageNumber: page, pageSize: 1000 })
    });
    if (!res.ok || !res.data || !res.data.items) break;
    allItems = allItems.concat(res.data.items);
    if (!res.data.hasNext) break;
    page++;
  }
  if (allItems.length > 0) cachedTerritories = allItems;
  return allItems;
}

export function toUUID(val?: string | null): string {
  if (!val) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(val)) return val;
  const hash = crypto.createHash("md5").update(val).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

export async function getTerritoriesForWilaya(
  settings: ZRSettings,
  wilayaCode: string | null,
  communeName?: string | null
): Promise<{ cityTerritoryId: string; districtTerritoryId: string } | null> {
  if (!wilayaCode) return null;
  const territories = await fetchAllTerritories(settings);
  
  const wilaya = territories.find(t => t.level === "wilaya" && String(t.code) === String(wilayaCode));
  if (!wilaya) return null;

  const communes = territories.filter(t => t.parentId === wilaya.id);
  if (communes.length === 0) return null;

  let commune = communes[0];
  if (communeName) {
    const cleanName = communeName.toLowerCase().trim();
    const match = communes.find(
      c => c.name.toLowerCase().trim() === cleanName || 
           c.nameArabic?.toLowerCase().trim() === cleanName ||
           c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanName.replace(/[^a-z0-9]/g, "")
    );
    if (match) {
      commune = match;
    }
  }

  return { cityTerritoryId: wilaya.id, districtTerritoryId: commune.id };
}

export async function zrCreateParcel(
  settings: ZRSettings,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: ZRParcel; error?: string }> {
  return zrFetch<ZRParcel>(settings, "/parcels", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function zrTestConnection(settings: ZRSettings): Promise<boolean> {
  console.log(`[ZR Express Connection Test] Initiating connection test...`);
  const res = await zrFetch(settings, "/customers/search", {
    method: "POST",
    body: JSON.stringify({ pageNumber: 1, pageSize: 1 })
  });
  console.log(`[ZR Express Connection Test] Completed. Status: ${res.ok ? "SUCCESS ✓" : "FAILED ✗"}`);
  if (!res.ok) {
    console.error(`[ZR Express Connection Test] Error description: ${res.error}`);
  }
  return res.ok;
}

// ── Customers API ─────────────────────────────────────────────────────────────

export async function zrSearchCustomers(
  settings: ZRSettings,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: ZRPagedCustomerResponse; error?: string }> {
  return zrFetch<ZRPagedCustomerResponse>(settings, "/customers/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function zrGetCustomerById(
  settings: ZRSettings,
  id: string
): Promise<{ ok: boolean; data?: ZRCustomer; error?: string }> {
  return zrFetch<ZRCustomer>(settings, `/customers/${encodeURIComponent(id)}`);
}

export async function zrDeleteCustomer(
  settings: ZRSettings,
  id: string
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/customers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function zrDeleteParcel(
  settings: ZRSettings,
  id: string
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/parcels/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function zrCreateIndividualCustomer(
  settings: ZRSettings,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, "/customers/individual", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function zrUpdateIndividualCustomer(
  settings: ZRSettings,
  id: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/customers/individual/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function zrDeleteCustomerAddress(
  settings: ZRSettings,
  customerId: string,
  addressId: string
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/customers/${encodeURIComponent(customerId)}/address/${encodeURIComponent(addressId)}`, {
    method: "DELETE",
  });
}

// ── Products API ──────────────────────────────────────────────────────────────

export async function zrCreateProduct(
  settings: ZRSettings,
  payload: ZRProductCreatePayload
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, "/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function zrUpdateProduct(
  settings: ZRSettings,
  id: string,
  payload: ZRProductUpdatePayload
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function zrDeleteProduct(
  settings: ZRSettings,
  id: string
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function zrUpdateProductPrice(
  settings: ZRSettings,
  id: string,
  basePrice: number
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/products/${encodeURIComponent(id)}/price`, {
    method: "PATCH",
    body: JSON.stringify({ id, basePrice }),
  });
}

export async function zrUpdateProductDiscount(
  settings: ZRSettings,
  id: string,
  promotionalPrice?: number,
  promotionStart?: string,
  promotionEnd?: string
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/products/${encodeURIComponent(id)}/discount`, {
    method: "PATCH",
    body: JSON.stringify({ id, promotionalPrice, promotionStart, promotionEnd }),
  });
}

export async function zrUpdateProductLocalStock(
  settings: ZRSettings,
  productId: string,
  localStock: number
): Promise<{ ok: boolean; data?: { id?: string }; error?: string }> {
  return zrFetch<{ id?: string }>(settings, `/products/product/${encodeURIComponent(productId)}/local-stock`, {
    method: "PATCH",
    body: JSON.stringify({ productId, localStock }),
  });
}


