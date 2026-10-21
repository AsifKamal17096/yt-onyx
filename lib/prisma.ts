import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";

/**
 * Single shared Prisma client.
 *
 * In development Next.js reloads modules on every change, so the instance is
 * cached on globalThis to avoid opening a new SQLite handle each time.
 *
 * The driver adapter keeps a pool per process. On Vercel each serverless
 * instance gets its own, which is why the pool is deliberately small — Neon's
 * pooled connection string (the one ending in -pooler) handles the fan-out.
 */
function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: resolveDatabaseUrl(),
    max: 3,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
