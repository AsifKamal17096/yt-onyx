import path from "node:path";

/**
 * Resolves DATABASE_URL to an absolute location.
 *
 * SQLite file URLs are relative by convention, but the Prisma CLI resolves them
 * against the schema folder while the runtime driver adapter resolves them
 * against the process working directory. That mismatch silently creates two
 * different database files, so both sides call this helper instead: a relative
 * `file:` URL always means "inside the prisma/ folder of the project root".
 *
 * Non-file URLs (postgresql://, mysql://, …) are returned untouched, so
 * switching providers needs no change here.
 */
export function resolveDatabaseUrl(raw = process.env.DATABASE_URL): string {
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and try again.",
    );
  }

  if (!raw.startsWith("file:")) return raw;

  const filePath = raw.slice("file:".length);
  if (path.isAbsolute(filePath)) return raw;

  const absolute = path.resolve(process.cwd(), "prisma", filePath);
  // Forward slashes keep the URL valid on Windows too.
  return `file:${absolute.split(path.sep).join("/")}`;
}
