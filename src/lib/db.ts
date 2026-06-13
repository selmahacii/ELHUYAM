import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Limite le nombre de connexions ouvertes en production pour éviter la saturation de la base de données
if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  if (!process.env.DATABASE_URL.includes("connection_limit")) {
    const separator = process.env.DATABASE_URL.includes("?") ? "&" : "?";
    process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}connection_limit=2`;
  }
}


export const db: any =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });


if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
