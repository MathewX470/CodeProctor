import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Setup WebSocket for Node.js environment (required for Neon Serverless outside of Edge)
neonConfig.webSocketConstructor = ws;

// Pass the PoolConfig directly to PrismaNeon (Prisma 6 adapter factory pattern)
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
