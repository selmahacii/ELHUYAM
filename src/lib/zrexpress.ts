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

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant": settings.tenantId,
        "X-Api-Key": settings.secretKey,
        "X-Tenant-Id": settings.tenantId,
        Authorization: `Bearer ${settings.secretKey}`,
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
      let errStr: string | undefined;
      if (json && typeof json === "object") {
        const j = json as Record<string, any>;
        if (typeof j.message === "string" && j.message) errStr = j.message;
        else if (typeof j.error === "string" && j.error) errStr = j.error;
        else if (Array.isArray(j.errors)) errStr = j.errors.join(", ");
        else if (typeof j.detail === "string" && j.detail) errStr = j.detail;
      }
      if (!errStr && text) {
        errStr = text.length > 200 ? text.slice(0, 200) + "..." : text;
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
