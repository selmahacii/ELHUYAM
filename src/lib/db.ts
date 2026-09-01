import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db: any =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = db;

/**
 * Resilient Database Query Wrapper
 * Automatically retries transient connection drops, pooler timeouts (P1001, P1008, P2024),
 * and cold-start socket resets from Supabase PgBouncer.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 250
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isTransient =
        error?.code === "P1001" ||
        error?.code === "P1008" ||
        error?.code === "P1017" ||
        error?.code === "P2024" ||
        error?.message?.includes("Can't reach database") ||
        error?.message?.includes("connection closed") ||
        error?.message?.includes("Connection terminated") ||
        error?.message?.includes("ECONNRESET") ||
        error?.message?.includes("timeout");

      if (isTransient && attempt <= maxRetries) {
        console.warn(
          `[withDbRetry] Attempt ${attempt} hit transient pooler issue (${error.code || error.message}). Retrying in ${delayMs * attempt}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
