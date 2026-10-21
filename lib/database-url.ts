/**
 * Reads DATABASE_URL and fails loudly if it is missing.
 *
 * Neon (and most hosted Postgres) give two connection strings: a direct one
 * and a pooled one whose host contains "-pooler". Serverless functions should
 * use the pooled string, which is what Vercel sets by default.
 */
export function resolveDatabaseUrl(raw = process.env.DATABASE_URL): string {
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your PostgreSQL connection string.",
    );
  }

  return raw;
}
