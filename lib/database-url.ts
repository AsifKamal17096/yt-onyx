/**
 * Where the PostgreSQL connection string comes from.
 *
 * DATABASE_URL is the name this project uses, but hosting integrations name
 * it differently — Vercel's Neon integration ships several at once, with a
 * configurable prefix. All of the usual names are accepted so a freshly
 * connected database works without renaming anything by hand.
 */

/**
 * Runtime connections, pooled first. Serverless functions open and discard
 * connections constantly, which is exactly what a pooler is for.
 */
const RUNTIME_CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

/**
 * Migrations need a *direct* connection, unpooled first.
 *
 * Prisma Migrate takes a session-level advisory lock, and a transaction-mode
 * pooler (Neon's "-pooler" endpoint, PgBouncer) cannot hold one — the lock
 * attempt times out with P1002 and the deployment fails. Falling back to the
 * pooled URL is better than failing outright on hosts that provide only one.
 */
const MIGRATION_CANDIDATES = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_POSTGRES_URL_NON_POOLING",
  "DATABASE_DATABASE_URL_UNPOOLED",
  ...RUNTIME_CANDIDATES,
] as const;

function firstConfigured(names: readonly string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/** The runtime connection string, or an empty string when none is set. */
export function databaseUrlOrEmpty(): string {
  return firstConfigured(RUNTIME_CANDIDATES);
}

/** The connection string Prisma CLI commands should use. */
export function migrationDatabaseUrl(): string {
  return firstConfigured(MIGRATION_CANDIDATES);
}

/**
 * The runtime connection string, or a clear error. Used by the application,
 * where a missing database is fatal and worth explaining.
 */
export function resolveDatabaseUrl(raw?: string): string {
  const url = raw?.trim() || databaseUrlOrEmpty();

  if (!url) {
    throw new Error(
      `No database connection string found. Set DATABASE_URL (looked for: ${RUNTIME_CANDIDATES.join(", ")}).`,
    );
  }

  return url;
}
