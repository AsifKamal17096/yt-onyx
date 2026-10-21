import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { prisma } from "@/lib/prisma";

/**
 * Site settings, as the public site sees them.
 *
 * Only the fields listed in `publicSettingsSelect` ever leave this module —
 * the admin password hash lives in the same row and must never reach a client
 * component or a cache entry that gets serialised to the browser.
 */

const publicSettingsSelect = {
  whatsappNumber: true,
  whatsappTemplate: true,
  heroHeadline: true,
  heroSubtext: true,
  heroImageKey: true,
  announcement: true,
  contactEmail: true,
  contactPhone: true,
  addressLine: true,
  mapEmbedUrl: true,
  instagramUrl: true,
  facebookUrl: true,
  pinterestUrl: true,
  tiktokUrl: true,
  logoKey: true,
} as const;

export type SiteSettingsPublic = {
  whatsappNumber: string | null;
  whatsappTemplate: string;
  heroHeadline: string;
  heroSubtext: string;
  heroImageKey: string | null;
  announcement: string | null;
  contactEmail: string;
  contactPhone: string | null;
  addressLine: string;
  mapEmbedUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  pinterestUrl: string | null;
  tiktokUrl: string | null;
  logoKey: string | null;
};

/** Used before the settings row exists (fresh database, no seed). */
export const DEFAULT_SETTINGS: SiteSettingsPublic = {
  whatsappNumber: null,
  whatsappTemplate:
    "Hello YT Onyx! I'm interested in ordering:\nProduct: {name}\nSKU: {sku}\nPrice: {price} USD\nQuantity: {qty}\nLink: {url}\n\nPlease confirm availability, shipping cost and delivery time to my country.",
  heroHeadline: "Stone shaped by hand, since 1992",
  heroSubtext:
    "Onyx and marble pieces carved, turned and polished in our workshop, then shipped to homes in over 40 countries.",
  heroImageKey: null,
  announcement: null,
  contactEmail: "",
  contactPhone: null,
  addressLine: "",
  mapEmbedUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  pinterestUrl: null,
  tiktokUrl: null,
  logoKey: null,
};

/**
 * Cached settings read. Every WhatsApp button, the header and the footer go
 * through this, and admin saves revalidate the `settings` tag.
 */
export async function getSiteSettings(): Promise<SiteSettingsPublic> {
  "use cache";
  cacheTag(CACHE_TAGS.settings);
  cacheLife("max");

  const row = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: publicSettingsSelect,
  });

  return row ?? DEFAULT_SETTINGS;
}
