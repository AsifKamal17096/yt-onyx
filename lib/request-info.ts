import crypto from "node:crypto";

/**
 * Visitor metadata taken from request headers.
 *
 * IPs are never stored in the clear: they are salted and hashed, which is
 * enough for rate limiting and spam detection while keeping the inquiry log
 * free of personal data.
 */

/** First public address from the usual proxy headers. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    null
  );
}

/** Two-letter country code, when the CDN or proxy provides one. */
export function clientCountry(headers: Headers): string | null {
  const raw =
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    headers.get("x-country-code") ??
    headers.get("x-geo-country");

  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Salted hash of an address. IP_HASH_SALT must be set in production; without
 * it the hash would be a plain lookup table of every IPv4 address.
 */
export function hashIp(ip: string | null): string {
  const salt = process.env.IP_HASH_SALT ?? "";

  if (!salt && process.env.NODE_ENV === "production") {
    console.warn(
      "IP_HASH_SALT is not set — visitor hashes are weak. Run `npm run secret`.",
    );
  }

  return crypto
    .createHash("sha256")
    .update(`${salt}:${ip ?? "unknown"}`)
    .digest("hex")
    .slice(0, 32);
}

/** Convenience wrapper used by API routes and server actions. */
export function visitorFromHeaders(headers: Headers) {
  return {
    ipHash: hashIp(clientIp(headers)),
    country: clientCountry(headers),
  };
}
