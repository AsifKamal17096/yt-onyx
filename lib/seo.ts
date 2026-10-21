import { absoluteUrl, BRAND, SITE_URL } from "@/lib/brand";
import type { ProductDetail } from "@/lib/catalog";
import { mediaUrl } from "@/lib/storage";

/**
 * JSON-LD builders.
 *
 * Structured data is what turns a shared product link into a rich result with
 * a price, and what tells search engines this is a shop rather than a blog.
 * Prices are always USD, matching what the page displays.
 */

const AVAILABILITY_SCHEMA = {
  IN_STOCK: "https://schema.org/InStock",
  MADE_TO_ORDER: "https://schema.org/PreOrder",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
} as const;

export function organizationSchema(settings: {
  contactEmail?: string | null;
  addressLine?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  pinterestUrl?: string | null;
  tiktokUrl?: string | null;
}) {
  const sameAs = [
    settings.instagramUrl,
    settings.facebookUrl,
    settings.pinterestUrl,
    settings.tiktokUrl,
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    logo: absoluteUrl(BRAND.logo),
    description: BRAND.description,
    foundingDate: String(BRAND.established),
    ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
    ...(settings.addressLine
      ? { address: { "@type": "PostalAddress", streetAddress: settings.addressLine } }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function productSchema(product: ProductDetail) {
  const images = product.images
    .map((image) => mediaUrl(image.fileKey))
    .filter((url): url is string => Boolean(url))
    .map((url) => absoluteUrl(url));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    ...(images.length > 0 ? { image: images } : {}),
    brand: { "@type": "Brand", name: BRAND.name },
    category: product.category.name,
    ...(product.stoneType
      ? {
          material: product.stoneType.name,
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Stone",
              value: product.stoneType.name,
            },
            ...(product.finish
              ? [
                  {
                    "@type": "PropertyValue",
                    name: "Finish",
                    value: product.finish.name,
                  },
                ]
              : []),
          ],
        }
      : {}),
    ...(product.weight
      ? {
          weight: {
            "@type": "QuantitativeValue",
            value: product.weight,
            unitText: product.weightUnit,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: AVAILABILITY_SCHEMA[product.availability],
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND.name },
    },
  };
}

export function breadcrumbSchema(
  trail: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

export function faqSchema(
  sections: { items: { question: string; answer: string }[] }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ),
  };
}

export function collectionSchema(category: {
  name: string;
  slug: string;
  description: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    url: absoluteUrl(`/category/${category.slug}`),
    ...(category.description ? { description: category.description } : {}),
    isPartOf: { "@type": "WebSite", name: BRAND.name, url: SITE_URL },
  };
}
