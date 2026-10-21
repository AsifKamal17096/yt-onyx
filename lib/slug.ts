/**
 * URL slugs.
 *
 * Slugs are part of the public URL and of the cache tags, so they have to be
 * predictable and unique. The admin form proposes one from the name and lets
 * it be edited; `uniqueSlug` then guarantees no collision.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    // Drop accents so "Café" becomes "cafe" rather than "caf".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Appends -2, -3 … until the slug is free.
 *
 * @param exists  checks the database for a conflicting row, excluding self
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "item";
  let candidate = root;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
    if (suffix > 200) {
      candidate = `${root}-${Date.now().toString(36)}`;
      break;
    }
  }

  return candidate;
}
