import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";

/**
 * Single shared Prisma client.
 *
 * In development Next.js reloads modules on every change, so the instance is
 * cached on globalThis to avoid opening a new SQLite handle each time.
 *
 * To switch to PostgreSQL: npm i @prisma/adapter-pg pg, then replace the two
 * adapter lines below with `new PrismaPg({ connectionString: ... })` and change
 * the provider in prisma/schema.prisma.
 */
function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() });

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
