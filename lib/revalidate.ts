import "server-only";
import { updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";

/**
 * Cache invalidation after an admin write.
 *
 * `updateTag` (Server Actions only) expires the entry and refreshes it inside
 * the same request, so the owner sees their change immediately rather than a
 * stale copy — the "read your writes" behaviour you want after pressing Save.
 */

export function revalidateProducts(slugs: string[] = []) {
  updateTag(CACHE_TAGS.products);
  for (const slug of slugs) updateTag(CACHE_TAGS.product(slug));
}

export function revalidateCategories(slugs: string[] = []) {
  updateTag(CACHE_TAGS.categories);
  for (const slug of slugs) updateTag(CACHE_TAGS.category(slug));
  // Category changes alter product listings and the shop filters too.
  updateTag(CACHE_TAGS.products);
}

export function revalidateAttributes() {
  updateTag(CACHE_TAGS.attributes);
  updateTag(CACHE_TAGS.products);
}

export function revalidateTestimonials() {
  updateTag(CACHE_TAGS.testimonials);
}

export function revalidateSettings() {
  updateTag(CACHE_TAGS.settings);
}

/** Used after an import or a bulk action, when the blast radius is unclear. */
export function revalidateEverything() {
  updateTag(CACHE_TAGS.products);
  updateTag(CACHE_TAGS.categories);
  updateTag(CACHE_TAGS.attributes);
  updateTag(CACHE_TAGS.settings);
  updateTag(CACHE_TAGS.testimonials);
}
