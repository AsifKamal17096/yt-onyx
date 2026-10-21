/**
 * Brand constants. Everything visual that is not editable from the admin panel
 * lives here, so swapping artwork or wording is a one-line change.
 */
export const BRAND = {
  name: "YT Onyx",
  shortName: "YT Onyx",
  established: 1992,
  tagline: "Artisan onyx & marble, hand-worked since 1992",
  description:
    "Hand-carved onyx and marble for the home: lamps, tableware, basins, furniture and gifts, made in our workshop since 1992 and shipped worldwide.",

  /**
   * Single source of truth for the logo. The cleaned PNG is generated from
   * public/logo.jpeg by `npm run logo:clean`; point this at a new file to
   * replace the logo everywhere (header, footer, favicon, Open Graph).
   */
  logo: "/logo-clean.png",
  /** Same mark with a transparent background, for placing on any colour. */
  logoMark: "/logo-mark.png",
  /** Untouched original, kept for reference only. */
  logoOriginal: "/logo.jpeg",
  /** Fallback social preview image. */
  ogImage: "/og-default.png",

  colors: {
    ink: "#0A0A0A",
    cream: "#F5F2EC",
    gold: "#B8935A",
  },
} as const;

/**
 * Public origin, without a trailing slash. Used for canonical URLs, the
 * sitemap, Open Graph tags and the product links inside WhatsApp messages.
 *
 * Set NEXT_PUBLIC_SITE_URL once a real domain is attached. Until then, Vercel
 * supplies the deployment's own address, so links are never left pointing at
 * localhost in production.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  vercelUrl ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
