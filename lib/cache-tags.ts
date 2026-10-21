/**
 * Cache tag vocabulary.
 *
 * Every cached read tags itself with one or more of these, and every admin
 * write revalidates the matching tags (see lib/revalidate.ts). Keeping the
 * strings in one place is what makes "edit a product, the page updates"
 * reliable instead of guesswork.
 */
export const CACHE_TAGS = {
  /** Any change to any product. */
  products: "products",
  /** One product, by slug. */
  product: (slug: string) => `product:${slug}`,
  /** The category list, names, images or ordering. */
  categories: "categories",
  /** One category's product listing, by slug. */
  category: (slug: string) => `category:${slug}`,
  /** Stone types, colours and finishes. */
  attributes: "attributes",
  /** Site settings: WhatsApp number, hero, contact details, logo. */
  settings: "settings",
  /** Customer testimonials on the home page. */
  testimonials: "testimonials",
} as const;
