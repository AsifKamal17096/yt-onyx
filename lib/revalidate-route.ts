import "server-only";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/**
 * Cache invalidation from a route handler.
 *
 * `updateTag` (lib/revalidate.ts) is only available inside Server Actions, so
 * route handlers use `revalidateTag`, which marks the entry stale and
 * refreshes it in the background. The second argument is the cache profile the
 * refreshed entry should take — "max" matches the catalogue reads.
 */
export function revalidateProductsFromRoute(slugs: string[] = []) {
  revalidateTag(CACHE_TAGS.products, "max");
  for (const slug of slugs) revalidateTag(CACHE_TAGS.product(slug), "max");
}

export function revalidateSettingsFromRoute() {
  revalidateTag(CACHE_TAGS.settings, "max");
}
