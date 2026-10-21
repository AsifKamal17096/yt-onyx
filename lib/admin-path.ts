/**
 * Where the admin lives.
 *
 * The real route files sit under app/admin, but the public URL is
 * /<ADMIN_PATH>, rewritten by proxy.ts. Setting ADMIN_PATH to something
 * unguessable makes the panel much harder to find, and the literal /admin
 * path then returns 404.
 *
 * Client components get this value from AdminPathProvider rather than from
 * the environment, because it must never be inlined into the public bundle.
 */
export const ADMIN_SEGMENT = (process.env.ADMIN_PATH || "admin")
  .trim()
  .replace(/^\/+|\/+$/g, "");

export const ADMIN_BASE = `/${ADMIN_SEGMENT}`;

/** Builds an absolute path inside the admin, e.g. adminUrl("/products"). */
export function adminUrl(path = ""): string {
  const suffix = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${ADMIN_BASE}${suffix}`;
}

/** True when ADMIN_PATH has been customised away from the default. */
export const ADMIN_PATH_IS_CUSTOM = ADMIN_SEGMENT !== "admin";
