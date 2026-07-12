import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db: any =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Toujours mettre en cache le client sur globalThis, y compris en production :
// sur cPanel/Passenger, les processus Node sont recyclés fréquemment, et sans ce
// cache chaque nouveau processus recrée un PrismaClient qui ouvre de nouvelles
// connexions MySQL sans jamais fermer les anciennes -> saturation progressive
// des connexions et erreurs 500 intermittentes.
globalForPrisma.prisma = db;
