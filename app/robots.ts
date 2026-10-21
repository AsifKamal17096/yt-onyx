import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

/**
 * robots.txt
 *
 * Deliberately says nothing about the admin area: naming a path here, even to
 * disallow it, is an invitation. The panel is kept out of search by its
 * noindex headers and by never being linked from a public page.
 *
 * API routes are excluded as a group — product imagery still reaches search
 * engines through the /_next/image optimizer, which stays crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
