/**
 * Where the PostgreSQL connection string comes from.
 *
 * DATABASE_URL is the name this project uses, but hosting integrations name
 * it differently — Vercel's Neon integration has shipped POSTGRES_URL and
 * POSTGRES_PRISMA_URL at various times. All of them are accepted so a
 * freshly connected database works without renaming anything by hand.
 *
 * Pooled connection strings (host contains "-pooler") are preferred for
 * serverless, which is what the integrations set first.
 */
const CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

/** The connection string, or an empty string when none is configured. */
export function databaseUrlOrEmpty(): string {
  for (const name of CANDIDATES) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/**
 * The connection string, or a clear error. Used by the application, where a
 * missing database is fatal and worth explaining.
 */
export function resolveDatabaseUrl(raw?: string): string {
  const url = raw?.trim() || databaseUrlOrEmpty();

  if (!url) {
    throw new Error(
      `No database connection string found. Set DATABASE_URL (looked for: ${CANDIDATES.join(", ")}).`,
    );
  }

  return url;
}
