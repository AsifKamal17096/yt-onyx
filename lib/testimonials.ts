import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

/**
 * Testimonials shown on the home page.
 *
 * Only published ones are ever returned, and the section disappears entirely
 * when there are none — better an absent section than placeholder praise.
 */
export async function getPublishedTestimonials(limit = 3) {
  "use cache";
  cacheTag(CACHE_TAGS.testimonials);
  cacheLife("max");

  return prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true, quote: true, name: true, location: true },
  });
}
